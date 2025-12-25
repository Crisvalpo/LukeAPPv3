-- Add DELETE policy for companies (Super Admin only)

CREATE POLICY "Super admins can delete companies"
  ON public.companies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'super_admin'
    )
  );
