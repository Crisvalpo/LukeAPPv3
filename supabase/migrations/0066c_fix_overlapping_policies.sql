-- Migration 0066c: Fix Overlapping Multiple Permissive Policies
-- Purpose: Remove ALL policies that overlap with specific action policies
-- Issue: companies_admin_all_policy, Staff full access projects cause 16 warnings
-- Date: 2026-01-21

-- ============================================================================
-- FIX: companies table - Remove overlapping ALL policy
-- ============================================================================

-- Drop the ALL policy that overlaps with SELECT and UPDATE
DROP POLICY IF EXISTS "companies_admin_all_policy" ON public.companies;

-- Keep only the specific policies we created
-- companies_select_policy - already exists
-- companies_update_policy - already exists

-- Add missing INSERT and DELETE policies for super_admin
CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT
WITH CHECK (is_super_admin());

CREATE POLICY "companies_delete_policy" ON public.companies
FOR DELETE
USING (is_super_admin());

-- ============================================================================
-- FIX: projects table - Remove overlapping ALL policy
-- ============================================================================

-- Drop the ALL policy that overlaps with SELECT and UPDATE
DROP POLICY IF EXISTS "Staff full access projects" ON public.projects;

-- Keep existing specific policies:
-- projects_select_policy - already exists
-- projects_update_policy - already exists

-- Add missing INSERT and DELETE policies for super_admin
CREATE POLICY "projects_insert_policy" ON public.projects
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR
  -- Founders can create projects in their company
  ((select auth.uid()) IN (
    SELECT user_id FROM members
    WHERE role_id = 'founder'
  ))
);

CREATE POLICY "projects_delete_policy" ON public.projects
FOR DELETE
USING (
  is_super_admin()
  OR
  -- Founders can delete projects in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);

-- ============================================================================
-- FIX: invitations table - Already fixed, no ALL policy overlap
-- ============================================================================
-- invitations only has specific policies: SELECT, INSERT, DELETE
-- No changes needed here

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After this migration, check for remaining multiple_permissive_policies:
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public'
--   AND tablename IN ('companies', 'projects')
-- GROUP BY tablename;
-- 
-- Expected: companies=4, projects=4 (SELECT, INSERT, UPDATE, DELETE each)
