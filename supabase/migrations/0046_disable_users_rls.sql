-- DISABLE RLS on users table (Nuclear Option for Dev/Blocker)
-- This removes all policy restrictions on public.users

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Note: This makes public.users readable/writable by ANY authenticated user
-- (and anonymity key depending on grants).
-- For production, this MUST be re-enabled and properly configured.

-- Verification
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
