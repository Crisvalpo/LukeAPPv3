-- Migration: Allow Admin users to create invitations for their project
-- Date: 2024-12-26
-- Description: Adds RLS policy to allow Admin-level users to invite supervisors and workers to their projects

-- Policy for Admin INSERT on invitations
CREATE POLICY "Admins can create invitations for their project"
ON public.invitations
FOR INSERT
WITH CHECK (
    -- User must be an admin of a project that belongs to this company
    EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid()
        AND members.role_id = 'admin'
        AND members.company_id = invitations.company_id
        AND members.project_id = invitations.project_id
    )
    AND
    -- Admins can only invite supervisor and worker roles (not admin or founder)
    invitations.role_id IN ('supervisor', 'worker')
);

-- Policy for Admin SELECT on invitations (view their project's invitations)
CREATE POLICY "Admins can view invitations for their project"
ON public.invitations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid()
        AND members.role_id = 'admin'
        AND members.company_id = invitations.company_id
        AND members.project_id = invitations.project_id
    )
);

-- Policy for Admin DELETE on invitations (revoke their project's invitations)
CREATE POLICY "Admins can delete invitations for their project"
ON public.invitations
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid()
        AND members.role_id = 'admin'
        AND members.company_id = invitations.company_id
        AND members.project_id = invitations.project_id
    )
);

COMMENT ON POLICY "Admins can create invitations for their project" ON public.invitations IS
'Allows admin users to invite supervisors and workers to their specific project';

COMMENT ON POLICY "Admins can view invitations for their project" ON public.invitations IS
'Allows admin users to view invitations for their specific project';

COMMENT ON POLICY "Admins can delete invitations for their project" ON public.invitations IS
'Allows admin users to revoke/delete invitations for their specific project';
