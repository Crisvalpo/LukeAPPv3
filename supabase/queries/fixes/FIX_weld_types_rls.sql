-- =============================================
-- CLEAN FIX: RLS Policies for project_weld_type_config
-- =============================================

-- Step 1: Drop ALL existing policies (ignore errors if they don't exist)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view weld types" ON project_weld_type_config;
    DROP POLICY IF EXISTS "Users can view weld types for their company projects" ON project_weld_type_config;
    DROP POLICY IF EXISTS "Admins can manage weld types" ON project_weld_type_config;
    DROP POLICY IF EXISTS "Admins and founders can manage weld types" ON project_weld_type_config;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if policy doesn't exist
END $$;

-- Step 2: Create new policies
-- Policy 1: SELECT - Anyone in the company can read
CREATE POLICY "Users can view weld types for their company projects"
  ON project_weld_type_config
  FOR SELECT
  USING (
    company_id IN (
      SELECT m.company_id
      FROM members m
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy 2: INSERT/UPDATE/DELETE - Founders and admins only
CREATE POLICY "Admins and founders can manage weld types"
  ON project_weld_type_config
  FOR ALL
  USING (
    company_id IN (
      SELECT m.company_id
      FROM members m
      LEFT JOIN company_roles cr ON m.functional_role_id = cr.id
      WHERE m.user_id = auth.uid()
        AND (
          m.role_id::text IN ('founder', 'admin')
          OR cr.base_role IN ('admin', 'founder')
        )
    )
  );

-- Step 3: Verify
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'project_weld_type_config'
ORDER BY policyname;
