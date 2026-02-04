-- FINAL FIX: Remove ALL conflicting policies and keep only safe ones
-- The policy "Members viewable by company siblings" causes infinite recursion

-- 1. Drop ALL existing SELECT policies on members
DROP POLICY IF EXISTS "Members viewable by company siblings" ON public.members;
DROP POLICY IF EXISTS "Avoid Recursion: View Own Row" ON public.members;
DROP POLICY IF EXISTS "members_select_policy" ON public.members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.members;
DROP POLICY IF EXISTS "Users can view team members" ON public.members;

-- 2. Create ONE consolidated, safe SELECT policy
CREATE POLICY "members_safe_select" 
ON public.members
FOR SELECT
USING (
  -- Super admins see everything (using secure function)
  is_super_admin()
  OR
  -- Users can see their own row
  user_id = auth.uid()
);

-- 3. Ensure the ALL policy for super_admin is present
DROP POLICY IF EXISTS "Staff full access members" ON public.members;
CREATE POLICY "Staff full access members" 
ON public.members 
FOR ALL 
USING (is_super_admin());
