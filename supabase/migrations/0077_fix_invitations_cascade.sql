-- Fix invitations foreign key to CASCADE delete when project is deleted
-- Also clean up existing orphaned invitations

-- First, delete orphaned invitations (where project was deleted but invitation remained)
DELETE FROM public.invitations
WHERE project_id IS NULL AND status IN ('pending', 'expired');

-- Update the foreign key constraint to CASCADE
ALTER TABLE public.invitations
DROP CONSTRAINT IF EXISTS invitations_project_id_fkey,
ADD CONSTRAINT invitations_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

COMMENT ON CONSTRAINT invitations_project_id_fkey ON public.invitations IS 
'Cascade delete: when project is deleted, all pending invitations to that project are deleted';
