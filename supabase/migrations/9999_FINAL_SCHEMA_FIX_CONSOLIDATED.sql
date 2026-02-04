-- FINAL SCHEMA & RPC FIX (CONSOLIDATED)
-- This version uses direct ALTER TABLE and CREATE FUNCTION commands to avoid PL/pgSQL block syntax issues.

-- 1. Table: invitations
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS functional_role_id uuid REFERENCES public.company_roles(id);
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES public.users(id);
ALTER TABLE public.invitations ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.invitations ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');

-- 2. Table: projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contract_number text DEFAULT 'S/N';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_name text DEFAULT 'Cliente Interno';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS week_end_day integer DEFAULT 6;

-- 3. Table: spools
ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS spool_number text;
ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING';
ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS total_welds integer DEFAULT 0;
ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS shop_welds integer DEFAULT 0;
ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS field_welds integer DEFAULT 0;
ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS total_inches numeric DEFAULT 0;

-- 4. Table: members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS functional_role_id uuid REFERENCES public.company_roles(id);

-- 5. Table: companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_projects_limit integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_users_limit integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS rut text;

-- 6. RPC FUNCTIONS (Cloud Aligned)

-- Function: get_invitation_by_token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_input text)
RETURNS TABLE (
    id uuid,
    email text,
    role_id public.user_role,
    company_name text,
    project_name text,
    status public.invitation_status
)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role_id,
        c.name as company_name,
        p.name as project_name,
        i.status
    FROM public.invitations i
    JOIN public.companies c ON c.id = i.company_id
    LEFT JOIN public.projects p ON p.id = i.project_id
    WHERE i.token = token_input
    AND i.status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

-- Function: accept_invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(token_input text, user_id_input uuid)
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

  -- 4. Create membership
  INSERT INTO public.members (
    user_id, company_id, project_id, role_id, functional_role_id, job_title
  ) VALUES (
    user_id_input, inv_record.company_id, inv_record.project_id, 
    inv_record.role_id, inv_record.functional_role_id, inv_record.job_title
  )
  RETURNING id INTO new_member_id;

  -- 5. Mark accepted
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = user_id_input
  WHERE id = inv_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Invitación aceptada correctamente',
    'member_id', new_member_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(text, uuid) TO authenticated;
