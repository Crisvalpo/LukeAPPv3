-- FIX LOCAL PERMISSIONS (Middleware Access)
-- This script ensures the user can read their own membership verification
-- Run this if "System: NONE" appears in logs despite having a member record.

BEGIN;

-- 1. Ensure the is_super_admin function is secure and robust
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- bypassing RLS
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.members 
    WHERE user_id = auth.uid() 
    AND role_id = 'super_admin'
  );
$$;

-- 2. Explicitly drop conflicting policies on members
DROP POLICY IF EXISTS "Users can view own membership" ON public.members;
DROP POLICY IF EXISTS "Read own membership" ON public.members;
DROP POLICY IF EXISTS "members_select_policy" ON public.members;
DROP POLICY IF EXISTS "Select own member record" ON public.members;

-- 3. Create a single, clean, undeniable SELECT policy
CREATE POLICY "Select own member record"
ON public.members
FOR SELECT
USING (
  -- Always allow users to see their own row
  auth.uid() = user_id
  OR
  -- Allow super admins to see everything (using the secure function)
  is_super_admin()
);

-- 4. Grant explicit permissions to authenticated role
GRANT SELECT ON public.members TO authenticated;

RAISE NOTICE '✅ Local permissions fixed for table: members';

COMMIT;
