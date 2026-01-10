-- Add ON DELETE CASCADE to all project-related foreign keys
-- This allows automatic cleanup when a project is deleted

-- Drop and recreate foreign keys with CASCADE

-- isometrics
ALTER TABLE public.isometrics
DROP CONSTRAINT IF EXISTS isometrics_project_id_fkey,
ADD CONSTRAINT isometrics_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- spools
ALTER TABLE public.spools
DROP CONSTRAINT IF EXISTS spools_project_id_fkey,
ADD CONSTRAINT spools_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- spools_joints
ALTER TABLE public.spools_joints
DROP CONSTRAINT IF EXISTS spools_joints_project_id_fkey,
ADD CONSTRAINT spools_joints_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- spools_welds
ALTER TABLE public.spools_welds
DROP CONSTRAINT IF EXISTS spools_welds_project_id_fkey,
ADD CONSTRAINT spools_welds_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- spools_mto
ALTER TABLE public.spools_mto
DROP CONSTRAINT IF EXISTS spools_mto_project_id_fkey,
ADD CONSTRAINT spools_mto_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- weld_executions
ALTER TABLE public.weld_executions
DROP CONSTRAINT IF EXISTS weld_executions_project_id_fkey,
ADD CONSTRAINT weld_executions_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- engineering_revisions
ALTER TABLE public.engineering_revisions
DROP CONSTRAINT IF EXISTS engineering_revisions_project_id_fkey,
ADD CONSTRAINT engineering_revisions_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- material_catalog
ALTER TABLE public.material_catalog
DROP CONSTRAINT IF EXISTS material_catalog_project_id_fkey,
ADD CONSTRAINT material_catalog_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- material_instances
ALTER TABLE public.material_instances
DROP CONSTRAINT IF EXISTS material_instances_project_id_fkey,
ADD CONSTRAINT material_instances_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- material_receipts
ALTER TABLE public.material_receipts
DROP CONSTRAINT IF EXISTS material_receipts_project_id_fkey,
ADD CONSTRAINT material_receipts_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- material_take_off
ALTER TABLE public.material_take_off
DROP CONSTRAINT IF EXISTS material_take_off_project_id_fkey,
ADD CONSTRAINT material_take_off_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- pipe_cutting_orders
ALTER TABLE public.pipe_cutting_orders
DROP CONSTRAINT IF EXISTS pipe_cutting_orders_project_id_fkey,
ADD CONSTRAINT pipe_cutting_orders_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- pipe_sticks
ALTER TABLE public.pipe_sticks
DROP CONSTRAINT IF EXISTS pipe_sticks_project_id_fkey,
ADD CONSTRAINT pipe_sticks_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- workshop_deliveries
ALTER TABLE public.workshop_deliveries
DROP CONSTRAINT IF EXISTS workshop_deliveries_project_id_fkey,
ADD CONSTRAINT workshop_deliveries_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- workshops
ALTER TABLE public.workshops
DROP CONSTRAINT IF EXISTS workshops_project_id_fkey,
ADD CONSTRAINT workshops_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- members - change from SET NULL to CASCADE to fully delete memberships
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_project_id_fkey,
ADD CONSTRAINT members_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- invitations - keep SET NULL is fine (invitations can remain but with no project)
-- No change needed for invitations

COMMENT ON CONSTRAINT isometrics_project_id_fkey ON public.isometrics IS 
'Cascade delete: when project is deleted, all related isometrics are deleted';

COMMENT ON CONSTRAINT spools_project_id_fkey ON public.spools IS 
'Cascade delete: when project is deleted, all related spools are deleted';

COMMENT ON CONSTRAINT members_project_id_fkey ON public.members IS 
'Cascade delete: when project is deleted, all related memberships are deleted';
