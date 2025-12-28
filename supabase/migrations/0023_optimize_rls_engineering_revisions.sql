/**
 * OPTIMIZE RLS WITH COMPANY_ID
 * 
 * Now that engineering_revisions has company_id, we can simplify RLS 
 * to be direct and more robust, avoiding complex joins.
 */

-- Drop existing complex policies
DROP POLICY IF EXISTS "Users can view engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can create engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can update engineering revisions" ON public.engineering_revisions;
DROP POLICY IF EXISTS "Users can delete engineering revisions" ON public.engineering_revisions;

-- Create new DIRECT policies using company_id (Much faster and safer)
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
