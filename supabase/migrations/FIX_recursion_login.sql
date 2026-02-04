-- FIX RECURSION LOGIN (Simplify RLS)
-- The "is_super_admin()" function triggers RLS when reading members, causing a loop.
-- We will simplify the policy to ONLY allow users to see their own row for now.
-- This is sufficient for the Middleware to identify the user.

-- 1. Drop conflicting policies
DROP POLICY IF EXISTS "Select own member record" ON public.members;
DROP POLICY IF EXISTS "members_select_policy" ON public.members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.members;
DROP POLICY IF EXISTS "metrics_select_policy" ON public.members;
DROP POLICY IF EXISTS "Staff full access members" ON public.members;
DROP POLICY IF EXISTS "Avoid Recursion: View Own Row" ON public.members;

-- 2. Create the simplest, recursion-free policy
-- Allow users to see ONLY explicit rows belonging to them.
CREATE POLICY "Avoid Recursion: View Own Row"
ON public.members
FOR SELECT
USING (
  user_id = auth.uid()
);

-- 3. Verify permissions
GRANT SELECT ON public.members TO authenticated;
