-- Add Foreign Key constraint for spools_mto.spool_id
-- This FK was missing from the original migration 0029

-- Add the foreign key constraint
ALTER TABLE spools_mto
ADD CONSTRAINT fk_spools_mto_spool
FOREIGN KEY (spool_id)
REFERENCES spools(id)
ON DELETE SET NULL;  -- If spool is deleted, set spool_id to NULL instead of cascading

-- Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_spools_mto_spool_id ON spools_mto(spool_id);

-- Verify constraint was added
COMMENT ON CONSTRAINT fk_spools_mto_spool ON spools_mto IS 
  'Links MTO entries to their corresponding spool. NULL allowed for spools not yet created.';
