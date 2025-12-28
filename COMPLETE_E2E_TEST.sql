/**
 * COMPLETE END-TO-END TEST PLAN
 * Execute these steps in order in Supabase SQL Editor
 */

-- ==========================================
-- PHASE 1: APPLY ALL MIGRATIONS
-- ==========================================

-- Migration 0022: Add company_id
ALTER TABLE public.engineering_revisions 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_eng_rev_company 
  ON public.engineering_revisions(company_id);

UPDATE public.engineering_revisions er
SET company_id = p.company_id
FROM public.projects p
WHERE er.project_id = p.id
  AND er.company_id IS NULL;

ALTER TABLE public.engineering_revisions 
  ALTER COLUMN company_id SET NOT NULL;

-- Migration 0023: Optimize RLS
DROP POLICY IF EXISTS "Users can view engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can create engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can update engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can delete engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "eng_rev_select" ON public.engineering_revisions;
DROP POLICY IF EXISTS "eng_rev_policy" ON public.engineering_revisions;

CREATE POLICY "Users can view engineering revisions"
  ON public.engineering_revisions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create engineering revisions"
  ON public.engineering_revisions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update engineering revisions"
  ON public.engineering_revisions FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete engineering revisions"
  ON public.engineering_revisions FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

-- ==========================================
-- PHASE 2: CLEAN DATA
-- ==========================================

DELETE FROM public.engineering_revisions;
DELETE FROM public.isometrics;

-- ==========================================
-- PHASE 3: INSERT CLEAN TEST DATA
-- ==========================================

-- Insert 1 test isometric
INSERT INTO public.isometrics (
    id, project_id, company_id, iso_number, revision, description, status, area
) VALUES (
    gen_random_uuid(),
    '611f713a-e055-47a7-b227-05a1d478b0ce',
    '44ec230b-5417-4663-b849-92af253d7dde',
    'TEST-UPLOAD-001',
    'A',
    'Clean test for upload debugging',
    'VIGENTE',
    'TEST AREA'
);

-- ==========================================
-- PHASE 4: VERIFICATION
-- ==========================================

-- Verify schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'engineering_revisions'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT policyname, cmd as operation
FROM pg_policies
WHERE tablename = 'engineering_revisions'
ORDER BY policyname;

-- Verify test data
SELECT id, iso_number, revision, status, company_id, project_id
FROM public.isometrics;

SELECT 
    'Setup complete! Ready for upload test.' as status,
    (SELECT COUNT(*) FROM engineering_revisions) as existing_revisions,
    (SELECT COUNT(*) FROM isometrics) as existing_isometrics;
