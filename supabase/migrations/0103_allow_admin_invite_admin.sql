-- Allow Admins to invite other Admins to their project
-- Previously they could only invite supervisor/worker

DROP POLICY IF EXISTS "Admins can create invitations for their project" ON public.invitations;

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
    -- Admins can invite admin, supervisor, and worker roles (not founder or super_admin)
    invitations.role_id IN ('admin', 'supervisor', 'worker')
);

COMMENT ON POLICY "Admins can create invitations for their project" ON public.invitations IS
'Allows admin users to invite other admins, supervisors and workers to their specific project';
