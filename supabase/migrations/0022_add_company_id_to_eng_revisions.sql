/**
 * ADD COMPANY_ID TO ENGINEERING_REVISIONS
 * 
 * Adds company_id column to engineering_revisions table for multi-tenant support
 * and to match the current service implementation.
 */

-- 1. Add company_id column if it doesn't exist
ALTER TABLE public.engineering_revisions 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_eng_rev_company 
  ON public.engineering_revisions(company_id);

-- 3. Backfill data: Update NULL company_id using project relationship
UPDATE public.engineering_revisions er
SET company_id = p.company_id
FROM public.projects p
WHERE er.project_id = p.id
  AND er.company_id IS NULL;

-- 4. Make company_id NOT NULL (ensure data integrity)
-- Note: This might fail if there are orphan revisions without valid projects,
-- but that shouldn't happen in a valid database state.
ALTER TABLE public.engineering_revisions 
  ALTER COLUMN company_id SET NOT NULL;

-- 5. Verify
SELECT 
  'Column company_id added to engineering_revisions successfully!' as message,
  COUNT(*) as total_revisions,
  COUNT(DISTINCT company_id) as companies_count
FROM public.engineering_revisions;
