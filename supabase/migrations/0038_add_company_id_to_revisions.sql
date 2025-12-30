-- Add company_id to engineering_revisions for multi-tenant isolation
-- This is critical for RLS and performance with large datasets

-- 1. Add company_id column
ALTER TABLE engineering_revisions
  ADD COLUMN IF NOT EXISTS company_id UUID;

-- 2. Populate company_id from projects table
UPDATE engineering_revisions
SET company_id = projects.company_id
FROM projects
WHERE engineering_revisions.project_id = projects.id
  AND engineering_revisions.company_id IS NULL;

-- 3. Make it NOT NULL after populating
ALTER TABLE engineering_revisions
  ALTER COLUMN company_id SET NOT NULL;

-- 4. Add foreign key constraint
ALTER TABLE engineering_revisions
  ADD CONSTRAINT fk_company
  FOREIGN KEY (company_id) REFERENCES companies(id);

-- 5. Add index for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_eng_rev_company ON engineering_revisions(company_id);

-- 6. Update RLS policy to use company_id (more efficient)
DROP POLICY IF EXISTS eng_rev_policy ON engineering_revisions;

CREATE POLICY eng_rev_company_isolation ON engineering_revisions
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id 
      FROM members 
      WHERE user_id = auth.uid()
    )
  );

-- Verification
SELECT 
  'engineering_revisions.company_id' as column_check,
  COUNT(*) as rows_with_company_id,
  COUNT(DISTINCT company_id) as unique_companies
FROM engineering_revisions;
