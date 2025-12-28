-- Check current RLS policies on engineering_revisions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'engineering_revisions';

-- Check if RLS is enabled
SELECT 
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'engineering_revisions';
