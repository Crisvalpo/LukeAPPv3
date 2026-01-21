-- Migration 0068c: Fix Members RLS Infinite Recursion (CRITICAL HOTFIX)
-- Purpose: Current policies cause recursion by querying members table within members policies
-- Date: 2026-01-21

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "members_select_staff" ON public.members;
DROP POLICY IF EXISTS "members_insert_staff" ON public.members;
DROP POLICY IF EXISTS "members_update_staff" ON public.members;
DROP POLICY IF EXISTS "members_delete_staff" ON public.members;

-- Create NON-RECURSIVE policies
-- Key: Don't use subqueries that reference the same table

CREATE POLICY "members_select_policy" ON public.members
FOR SELECT
USING (
  is_super_admin()
  OR
  -- Users can view their own membership record
  user_id = (select auth.uid())
  OR
  -- Users can view members of their company (via get_my_company_ids_v2 helper)
  company_id IN (SELECT get_my_company_ids_v2())
);

CREATE POLICY "members_insert_policy" ON public.members
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR
  -- Founders/admins can add members to companies they belong to
  company_id IN (SELECT get_my_company_ids_v2())
);

CREATE POLICY "members_update_policy" ON public.members
FOR UPDATE
USING (
  is_super_admin()
  OR
  -- Users can update their own profile fields (job_title, etc)
  user_id = (select auth.uid())
)
WITH CHECK (
  is_super_admin()
  OR
  user_id = (select auth.uid())
);

CREATE POLICY "members_delete_policy" ON public.members
FOR DELETE
USING (
  is_super_admin()
  OR
  -- Founders can remove members from their companies
  company_id IN (SELECT get_my_company_ids_v2())
);

-- Note: get_my_company_ids_v2() returns company_ids for current user
-- This avoids recursion because it's a function, not a subquery on members
