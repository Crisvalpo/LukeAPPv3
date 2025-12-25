const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
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
`

async function executeSQLDirect() {
    console.log('🔧 Aplicando RLS policies para projects...\n')

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        })

        const result = await response.text()

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}:`, result)
            throw new Error(result)
        }

        console.log('✅ RLS policies para projects aplicadas exitosamente!')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
