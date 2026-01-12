-- Add missing project_id column to spools_welds table
-- This column is referenced in the insert but was missing from the schema

ALTER TABLE spools_welds
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_spools_welds_project ON spools_welds(project_id);

COMMENT ON COLUMN spools_welds.project_id IS 'Project reference for data isolation and querying';
