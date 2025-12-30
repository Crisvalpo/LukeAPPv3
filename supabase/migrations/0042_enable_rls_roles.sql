-- SECURITY FIX: Enable RLS on roles table
-- Currently has policies but RLS is disabled = DATA LEAK

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Verification
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles') as policy_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'roles';
