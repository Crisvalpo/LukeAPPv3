-- =====================================================
-- Migration: Add Functional Role to Members and Invitations
-- Description: Links members and invitations to company_roles
-- Author: LukeAPP Development Team
-- Date: 2025-12-26
-- =====================================================

-- ==========================================
-- 1. ADD FUNCTIONAL_ROLE_ID TO MEMBERS
-- ==========================================

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS functional_role_id uuid REFERENCES public.company_roles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.members.functional_role_id IS 'References the company-defined functional role (optional, for UX)';

-- Create index for faster joins
CREATE INDEX IF NOT EXISTS idx_members_functional_role ON public.members(functional_role_id);

-- ==========================================
-- 2. ADD FUNCTIONAL_ROLE_ID TO INVITATIONS
-- ==========================================

ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS functional_role_id uuid REFERENCES public.company_roles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.invitations.functional_role_id IS 'The functional role to assign when invitation is accepted';

-- Create index
CREATE INDEX IF NOT EXISTS idx_invitations_functional_role ON public.invitations(functional_role_id);

-- ==========================================
-- 3. UPDATE ACCEPT_INVITATION RPC FUNCTION
-- ==========================================

-- Drop existing function
-- Drop specific existing function to avoid ambiguity
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);

-- Recreate with functional_role_id support
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_id_input uuid,
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
BEGIN
  -- 1. Fetch invitation (with lock)
  SELECT * INTO inv_record
  FROM public.invitations
  WHERE id = invitation_id_input
  AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invitación no encontrada o ya usada'
    );
  END IF;

  -- 2. Verify email matches
  IF inv_record.email != (SELECT email FROM auth.users WHERE id = user_id_input) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Esta invitación no es para tu email'
    );
  END IF;

  -- 3. Check if already a member
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

  -- 4. Create membership (with functional_role_id)
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
    inv_record.functional_role_id,  -- NEW: Assign functional role
    inv_record.job_title
  )
  RETURNING id INTO new_member_id;

  -- 5. Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = invitation_id_input;

  -- 6. Return success
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_invitation(uuid, uuid) IS 'Accepts an invitation and creates a member with functional role assignment';
