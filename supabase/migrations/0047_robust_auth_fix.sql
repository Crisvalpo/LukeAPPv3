-- Migration 0047: Robust Auth Fix (Trigger + RPC)
-- Description: Fixes "Database error finding user" by making the trigger non-blocking 
-- and adding a self-healing mechanism in the accept_invitation RPC.

-- 1. FIX TRIGGER FUNCTION (handle_new_user)
-- Make it fail-safe. If it fails, we catch it and proceed.
-- The RPC will handle the missing profile.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        updated_at = now();
        
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Log error but DO NOT FAIL the transaction
    RAISE WARNING 'Trigger handle_new_user failed for %: %', new.id, SQLERRM;
    RETURN new; -- Proceed with auth user creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. FIX RPC FUNCTION (accept_invitation)
-- Matches client signature: (token_input text, user_id_input uuid)
-- Adds "Self-Healing": Checks for user profile and creates it if missing

CREATE OR REPLACE FUNCTION public.accept_invitation(
  token_input text,
  user_id_input uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_record record;
  new_member_id uuid;
  user_email text;
  user_meta jsonb;
BEGIN
  -- 1. Fetch invitation (with lock)
  SELECT * INTO inv_record
  FROM public.invitations
  WHERE token = token_input
  AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Invitación no encontrada o ya usada'
    );
  END IF;

  -- 2. Verify email matches (Security Check)
  SELECT email, raw_user_meta_data INTO user_email, user_meta 
  FROM auth.users 
  WHERE id = user_id_input;

  IF inv_record.email != user_email THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Esta invitación no es para tu email actual (' || user_email || ' vs ' || inv_record.email || ')'
    );
  END IF;

  -- 3. SELF-HEALING: Ensure public.users profile exists
  -- If the trigger failed silently, this step fixes it.
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id_input) THEN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        user_id_input,
        user_email,
        user_meta->>'full_name',
        user_meta->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING; -- Race condition safety
  END IF;

  -- 4. Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = user_id_input
    AND company_id = inv_record.company_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Ya eres miembro de esta empresa'
    );
  END IF;

  -- 5. Create membership (with functional_role_id support)
  INSERT INTO public.members (
    user_id,
    company_id,
    project_id,
    role_id,
    functional_role_id,
    job_title
  ) VALUES (
    user_id_input,
    inv_record.company_id,
    inv_record.project_id,
    inv_record.role_id,
    inv_record.functional_role_id,
    inv_record.job_title
  )
  RETURNING id INTO new_member_id;

  -- 6. Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_at = now(),
      accepted_by = user_id_input -- Assuming we add this column eventually, or just updated_at
  WHERE id = inv_record.id;

  -- 7. Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invitación aceptada correctamente',
    'member_id', new_member_id,
    'company_id', inv_record.company_id,
    'project_id', inv_record.project_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Error al aceptar invitación: ' || SQLERRM
    );
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.accept_invitation(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text, uuid) TO service_role;
