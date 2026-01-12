-- Fix foreign key constraint on isometrics.current_revision_id
-- to allow deleting revisions by setting current_revision_id to NULL

-- Drop existing constraint if it exists
ALTER TABLE isometrics 
DROP CONSTRAINT IF EXISTS isometrics_current_revision_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE isometrics
ADD CONSTRAINT isometrics_current_revision_id_fkey 
FOREIGN KEY (current_revision_id) 
REFERENCES engineering_revisions(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT isometrics_current_revision_id_fkey ON isometrics IS 
'When a revision is deleted, current_revision_id is set to NULL instead of blocking the deletion';
