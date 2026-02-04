-- DEBUG SCRIPT
-- Run this in your Local SQL Editor to verify why login is failing

-- 1. Verify FUNCTION Security
-- 'prosecdef' MUST be true (t). If false, the bug is still present.
SELECT 
    proname, 
    prosecdef, -- This is the critical flag (SECURITY DEFINER)
    prosrc     -- The source code (should check members without recursion)
FROM pg_proc 
WHERE proname = 'is_super_admin';

-- 2. Verify Active POLICIES
-- Check what RLS rules are actually active on the members table.
SELECT 
    policyname, 
    cmd, -- SELECT, INSERT, etc.
    qual -- The condition logic
FROM pg_policies 
WHERE tablename = 'members';

-- 3. Verify YOUR USER
-- Does the member record exist?
SELECT * FROM public.members;
