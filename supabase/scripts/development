/**
 * APPLY ALL PENDING MIGRATIONS IN ORDER
 * 
 * Execute this BEFORE the cleanup script to ensure schema is correct
 */

-- ==========================================
-- Migration 0022: Add company_id to engineering_revisions
-- ==========================================

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

-- ==========================================
-- Migration 0023: Optimize RLS with company_id
-- ==========================================

DROP POLICY IF EXISTS "Users can view engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can create engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can update engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can delete engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "eng_rev_select" ON public.engineering_revisions;
DROP POLICY IF EXISTS "eng_rev_policy" ON public.engineering_revisions;

CREATE POLICY "Users can view engineering revisions"
  ON public.engineering_revisions
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create engineering revisions"
  ON public.engineering_revisions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update engineering revisions"
  ON public.engineering_revisions
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete engineering revisions"
  ON public.engineering_revisions
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- VERIFY
-- ==========================================

SELECT 'All migrations applied successfully!' as status;

-- Show all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'engineering_revisions'
ORDER BY policyname;

-- Show all columns
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'engineering_revisions'
ORDER BY ordinal_position;
