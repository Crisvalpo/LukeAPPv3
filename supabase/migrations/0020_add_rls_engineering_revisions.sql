/**
 * ADD RLS POLICIES FOR ENGINEERING_REVISIONS
 * 
 * Enables RLS and adds policies for multi-tenant access
 */

-- Enable RLS on engineering_revisions
ALTER TABLE public.engineering_revisions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select revisions from their company's projects
CREATE POLICY "Users can view revisions from their company"
  ON public.engineering_revisions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.user_id = auth.uid()
        AND m.company_id IN (
          SELECT company_id FROM public.projects
          WHERE id = engineering_revisions.project_id
        )
    )
  );

-- Policy: Users can insert revisions for their company's projects
CREATE POLICY "Users can create revisions for their company"
  ON public.engineering_revisions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.user_id = auth.uid()
        AND m.company_id IN (
          SELECT company_id FROM public.projects
          WHERE id = engineering_revisions.project_id
        )
    )
  );

-- Policy: Users can update revisions from their company
CREATE POLICY "Users can update revisions from their company"
  ON public.engineering_revisions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.user_id = auth.uid()
        AND m.company_id IN (
          SELECT company_id FROM public.projects
          WHERE id = engineering_revisions.project_id
        )
    )
  );

-- Policy: Users can delete revisions from their company
CREATE POLICY "Users can delete revisions from their company"
  ON public.engineering_revisions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.user_id = auth.uid()
        AND m.company_id IN (
          SELECT company_id FROM public.projects
          WHERE id = engineering_revisions.project_id
        )
    )
  );

-- Verify
SELECT 
  'RLS policies created successfully!' as message,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'engineering_revisions';
