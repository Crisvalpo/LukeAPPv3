-- RLS Policies for Projects Table

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Super admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can update all projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Founders can view their company projects" ON public.projects;
DROP POLICY IF EXISTS "Founders can create projects for their company" ON public.projects;
DROP POLICY IF EXISTS "Founders can update their company projects" ON public.projects;
DROP POLICY IF EXISTS "Founders can delete their company projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view their company projects" ON public.projects;

-- Super Admin: Full access
CREATE POLICY "Super admins can view all projects"
  ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all projects"
  ON public.projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete projects"
  ON public.projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'super_admin'
    )
  );

-- Founder: Can manage projects in their company
CREATE POLICY "Founders can view their company projects"
  ON public.projects
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'founder'
    )
  );

CREATE POLICY "Founders can create projects for their company"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'founder'
    )
  );

CREATE POLICY "Founders can update their company projects"
  ON public.projects
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'founder'
    )
  );

CREATE POLICY "Founders can delete their company projects"
  ON public.projects
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'founder'
    )
  );

-- Members: Can view projects in their company
CREATE POLICY "Members can view their company projects"
  ON public.projects
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.members
      WHERE members.user_id = auth.uid()
    )
  );
