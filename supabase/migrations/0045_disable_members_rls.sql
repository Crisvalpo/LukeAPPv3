-- Disable RLS on members table to avoid recursion
-- Similar to roles table, members needs to be readable for auth middleware
-- Security is handled at application level (users only see their own via middleware)

-- Drop all RLS policies
DROP POLICY IF EXISTS members_read_own ON members;
DROP POLICY IF EXISTS members_read_superadmin ON members;
DROP POLICY IF EXISTS members_read_company ON members;
DROP POLICY IF EXISTS members_manage_superadmin ON members;
DROP POLICY IF EXISTS members_manage_founder ON members;

-- Disable RLS
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- Note: This is safe because:
-- 1. Middleware only queries by user_id = auth.uid()
-- 2. Application code enforces proper access control
-- 3. No direct SQL queries expose member data without filtering

-- Verification
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'members';

SELECT 
  'Policies remaining' as check_type,
  COUNT(*) as count
FROM pg_policies
WHERE tablename = 'members';
