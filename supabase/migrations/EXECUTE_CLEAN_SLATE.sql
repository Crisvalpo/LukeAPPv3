-- CRITICAL: Clean Slate Migration
-- Purpose: Wipe engineering data and enforce strict lifecycle revision_status
-- Execute in Supabase SQL Editor

-- 1. TRUNCATE ALL ENGINEERING DATA (CASCADE)
TRUNCATE TABLE engineering_revisions CASCADE;

-- 2. UPDATE CONSTRAINT TO LIFECYCLE ONLY
ALTER TABLE engineering_revisions 
  DROP CONSTRAINT IF EXISTS engineering_revisions_revision_status_check;

ALTER TABLE engineering_revisions
  ADD CONSTRAINT engineering_revisions_revision_status_check 
  CHECK (revision_status IN ('DRAFT', 'VIGENTE', 'OBSOLETA', 'ANULADA'));

-- 3. INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_revisions_vigente 
  ON engineering_revisions(project_id, revision_status) 
  WHERE revision_status = 'VIGENTE';

-- 4. VERIFICATION
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'engineering_revisions_revision_status_check';
