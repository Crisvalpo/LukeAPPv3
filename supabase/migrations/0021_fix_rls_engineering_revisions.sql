/**
 * FIX RLS POLICIES FOR ENGINEERING_REVISIONS
 * 
 * Drops and recreates policies with correct logic
 */

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view revisions from their company" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can create revisions for their company" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can update revisions from their company" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can delete revisions from their company" ON public.engineering_revisions;

-- Policy: SELECT - Users can view revisions from their projects
CREATE POLICY "Users can view engineering revisions"
  ON public.engineering_revisions
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      INNER JOIN public.members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy: INSERT - Users can create revisions for their projects
CREATE POLICY "Users can create engineering revisions"
  ON public.engineering_revisions
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      INNER JOIN public.members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy: UPDATE - Users can update revisions from their projects
CREATE POLICY "Users can update engineering revisions"
  ON public.engineering_revisions
  FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      INNER JOIN public.members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy: DELETE - Users can delete revisions from their projects
CREATE POLICY "Users can delete engineering revisions"
  ON public.engineering_revisions
  FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      INNER JOIN public.members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Verify
SELECT 
  'RLS policies fixed successfully!' as message,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'engineering_revisions'
ORDER BY cmd;
