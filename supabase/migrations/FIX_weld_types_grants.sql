-- =============================================
-- FIX: Table-level GRANT permissions
-- =============================================

-- The issue is NOT RLS, it's missing GRANT permissions
-- The authenticated/anon users don't have SELECT permission

-- Step 1: Check current grants
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'project_weld_type_config';

-- Step 2: Grant permissions to authenticated users
GRANT SELECT ON project_weld_type_config TO authenticated;
GRANT INSERT ON project_weld_type_config TO authenticated;
GRANT UPDATE ON project_weld_type_config TO authenticated;
GRANT DELETE ON project_weld_type_config TO authenticated;

-- Also grant to anon (for public reads if needed)
GRANT SELECT ON project_weld_type_config TO anon;

-- Step 3: Verify grants were applied
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'project_weld_type_config'
ORDER BY grantee, privilege_type;
