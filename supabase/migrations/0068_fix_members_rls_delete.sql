-- Migration 0068: Fix Members Table RLS DELETE Policy
-- Purpose: Fix missing DELETE permission for super_admin
-- Issue: Policy "Staff full access members" has ALL but missing with_check
-- Date: 2026-01-21

-- Drop the problematic ALL policy
DROP POLICY IF EXISTS "Staff full access members" ON public.members;

-- Create separate policies for super_admin (cleaner than ALL with both qual and with_check)
CREATE POLICY "members_select_staff" ON public.members
FOR SELECT
USING (
  is_super_admin()
  OR
  -- Users can view own membership
  auth.uid() = user_id
  OR
  -- Users can view team members
  company_id IN (
    SELECT company_id FROM members WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "members_insert_staff" ON public.members
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR
  -- Founders/admins can add members to their companies
  company_id IN (
    SELECT m.company_id FROM members m
    WHERE m.user_id = (select auth.uid()) 
      AND m.role_id IN ('founder', 'admin')
  )
);

CREATE POLICY "members_update_staff" ON public.members
FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "members_delete_staff" ON public.members
FOR DELETE
USING (
  is_super_admin()
  OR
  -- Founders can remove members from their companies
  company_id IN (
    SELECT m.company_id FROM members m
    WHERE m.user_id = (select auth.uid()) 
      AND m.role_id = 'founder'
  )
);

-- Drop old overlapping policies if they exist
DROP POLICY IF EXISTS "Users can view own membership" ON public.members;
DROP POLICY IF EXISTS "Users can view team members" ON public.members;

-- Verification: Check new policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'members' ORDER BY cmd, policyname;
