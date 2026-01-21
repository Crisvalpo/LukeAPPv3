-- Fix invitation delete policy to include Founders
-- Previously only allowed Super Admin or Project Admin

DROP POLICY IF EXISTS "invitations_delete_policy" ON public.invitations;

CREATE POLICY "invitations_delete_policy" ON public.invitations
FOR DELETE
USING (
  is_super_admin() OR 
  -- Allow Founders to delete any invitation in their company
  (company_id IN (
    SELECT m.company_id 
    FROM public.members m 
    WHERE m.user_id = (SELECT auth.uid()) 
    AND m.role_id = 'founder'
  )) OR
  -- Allow Project Admins to delete invitations for their project
  (EXISTS (
    SELECT 1 
    FROM public.members m
    WHERE m.user_id = (SELECT auth.uid())
    AND m.role_id = 'admin'
    AND m.company_id = invitations.company_id
    AND m.project_id = invitations.project_id
  ))
);
