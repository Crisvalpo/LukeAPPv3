/**
 * ADD COMPANY_ID TO ISOMETRICS
 * 
 * Adds company_id column to isometrics table for multi-tenant support
 */

-- Add company_id column if it doesn't exist
ALTER TABLE public.isometrics 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add index for company_id
CREATE INDEX IF NOT EXISTS idx_isometrics_company 
  ON public.isometrics(company_id);

-- Update NULL company_id with project's company
UPDATE public.isometrics i
SET company_id = p.company_id
FROM public.projects p
WHERE i.project_id = p.id
  AND i.company_id IS NULL;

-- Make company_id NOT NULL after backfill
ALTER TABLE public.isometrics 
  ALTER COLUMN company_id SET NOT NULL;

-- Verify
SELECT 
  'Column company_id added successfully!' as message,
  COUNT(*) as total_isometrics,
  COUNT(DISTINCT company_id) as unique_companies
FROM public.isometrics;
