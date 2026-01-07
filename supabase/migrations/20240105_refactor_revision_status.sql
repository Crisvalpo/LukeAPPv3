-- Migration: Refactor Revision Status Architecture
-- 1. Truncate Data (Clean Slate)
-- 2. Update Check Constraints for Strict Lifecycle

-- 1. CLEAN SLATE (Cascade to remove spools, mto, etc)
TRUNCATE TABLE engineering_revisions CASCADE;

-- 2. UPDATE CONSTRAINT
ALTER TABLE engineering_revisions 
  DROP CONSTRAINT IF EXISTS engineering_revisions_revision_status_check;

ALTER TABLE engineering_revisions
  ADD CONSTRAINT engineering_revisions_revision_status_check 
  CHECK (revision_status IN ('DRAFT', 'VIGENTE', 'OBSOLETA', 'ANULADA'));

-- 3. ENSURE INDEX
CREATE INDEX IF NOT EXISTS idx_revisions_vigente 
  ON engineering_revisions(project_id) 
  WHERE revision_status = 'VIGENTE';
