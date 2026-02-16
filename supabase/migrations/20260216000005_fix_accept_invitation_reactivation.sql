-- Update accept_invitation to support Reactivation (Soft Delete / Re-hire)
CREATE OR REPLACE FUNCTION public.accept_invitation(token_input text, user_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_record record;
  existing_member_id uuid;
  target_member_id uuid;
  user_email text;
  user_meta jsonb;
BEGIN
  -- 1. Fetch invitation
  SELECT i.* INTO inv_record
  FROM public.invitations i
  WHERE i.token = token_input
  AND i.status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invitación no encontrada o ya usada');
  END IF;

  -- 2. Verify email matches 
  SELECT email, raw_user_meta_data INTO user_email, user_meta 
  FROM auth.users WHERE id = user_id_input;

  IF inv_record.email != user_email THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta invitación no es para tu email actual');
  END IF;

  -- 3. Self-healing profile
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id_input) THEN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (user_id_input, user_email, user_meta->>'full_name', user_meta->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 4. Check for existing (possibly deactivated) membership in this company
  SELECT id INTO existing_member_id
  FROM public.members
  WHERE user_id = user_id_input
  AND company_id = inv_record.company_id
  LIMIT 1;

  IF existing_member_id IS NOT NULL THEN
    -- REACTIVATION LOGIC
    UPDATE public.members
    SET 
      active = true,
      project_id = COALESCE(inv_record.project_id, project_id),
      role_id = inv_record.role_id,
      functional_role_id = inv_record.functional_role_id,
      job_title = inv_record.job_title,
      updated_at = now()
    WHERE id = existing_member_id
    RETURNING id INTO target_member_id;
  ELSE
    -- NEW MEMBERSHIP LOGIC
    INSERT INTO public.members (
      user_id, company_id, project_id, role_id, functional_role_id, job_title, active
    ) VALUES (
      user_id_input, inv_record.company_id, inv_record.project_id, 
      inv_record.role_id, inv_record.functional_role_id, inv_record.job_title, true
    )
    RETURNING id INTO target_member_id;
  END IF;

  -- 5. Mark accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = user_id_input
  WHERE id = inv_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', CASE WHEN existing_member_id IS NOT NULL THEN 'Bienvenido de nuevo! Tu cuenta ha sido reactivada.' ELSE 'Invitación aceptada correctamente' END,
    'member_id', target_member_id,
    'reactivated', existing_member_id IS NOT NULL
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;
