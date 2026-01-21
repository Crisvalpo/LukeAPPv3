-- Migration 0066b: Hotfix - Complete auth.uid() wrapping in new policies
-- Purpose: Fix remaining unwrapped auth.uid() calls in policies created by 0066
-- Issue: Policies had wrapping in helper functions but not in direct inline queries
-- Date: 2026-01-21

-- ============================================================================
-- FIX: companies table policies
-- ============================================================================

DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
CREATE POLICY "companies_select_policy" ON public.companies
FOR SELECT
USING (
  -- Super admin: full access
  is_super_admin()
  OR
  -- Founders: their company
  id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
  OR
  -- Members: their company
  id IN (SELECT get_my_company_ids_v2())  -- ✅ Uses optimized function
);

DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE
USING (
  -- Super admin: full access
  is_super_admin()
  OR
  -- Founders: their company only
  id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
);

-- ============================================================================
-- FIX: invitations table policies
-- ============================================================================

DROP POLICY IF EXISTS "invitations_select_policy" ON public.invitations;
CREATE POLICY "invitations_select_policy" ON public.invitations
FOR SELECT
USING (
  -- Super admin: all invitations
  is_super_admin()
  OR
  -- Read own invitation by email
  email = (auth.jwt() ->> 'email'::text)  -- ✅ No uid() here, safe
  OR
  -- Founders: all invitations in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
  OR
  -- Admins: invitations for their project
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = (select auth.uid())  -- ✅ Already wrapped
      AND role_id = 'admin'
      AND company_id = invitations.company_id
      AND project_id = invitations.project_id
  )
);

DROP POLICY IF EXISTS "invitations_insert_policy" ON public.invitations;
CREATE POLICY "invitations_insert_policy" ON public.invitations
FOR INSERT
WITH CHECK (
  -- Super admin: can invite anywhere
  is_super_admin()
  OR
  -- Founders: can invite to their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
  OR
  -- Admins: can invite to their project only
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = (select auth.uid())  -- ✅ Already wrapped
      AND role_id = 'admin'
      AND company_id = invitations.company_id
      AND project_id = invitations.project_id
  )
);

DROP POLICY IF EXISTS "invitations_delete_policy" ON public.invitations;
CREATE POLICY "invitations_delete_policy" ON public.invitations
FOR DELETE
USING (
  -- Super admin: can delete any
  is_super_admin()
  OR
  -- Admins: can delete from their project
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = (select auth.uid())  -- ✅ Already wrapped
      AND role_id = 'admin'
      AND company_id = invitations.company_id
      AND project_id = invitations.project_id
  )
);

-- ============================================================================
-- FIX: company_roles table policies
-- ============================================================================

DROP POLICY IF EXISTS "company_roles_select_policy" ON public.company_roles;
CREATE POLICY "company_roles_select_policy" ON public.company_roles
FOR SELECT
USING (
  -- Super admin: all roles
  is_super_admin()
  OR
  -- Founders, Admins, Members: their company roles
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid())  -- ✅ Now wrapped!
  )
);

DROP POLICY IF EXISTS "company_roles_insert_policy" ON public.company_roles;
CREATE POLICY "company_roles_insert_policy" ON public.company_roles
FOR INSERT
WITH CHECK (
  -- Super admin: can create anywhere
  is_super_admin()
  OR
  -- Founders: can create in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
);

DROP POLICY IF EXISTS "company_roles_update_policy" ON public.company_roles;
CREATE POLICY "company_roles_update_policy" ON public.company_roles
FOR UPDATE
USING (
  -- Super admin: can update any
  is_super_admin()
  OR
  -- Founders: can update in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
);

DROP POLICY IF EXISTS "company_roles_delete_policy" ON public.company_roles;
CREATE POLICY "company_roles_delete_policy" ON public.company_roles
FOR DELETE
USING (
  -- Super admin: can delete any
  is_super_admin()
  OR
  -- Founders: can delete in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
);

-- ============================================================================
-- FIX: projects table policies
-- ============================================================================

-- Also drop old policy that wasn't cleaned up
DROP POLICY IF EXISTS "projects_read" ON public.projects;

DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects
FOR SELECT
USING (
  -- Super admin: all projects
  is_super_admin()
  OR
  -- Founders: projects in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
  OR
  -- Project-scoped roles: their assigned project
  id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid()) AND project_id IS NOT NULL  -- ✅ Now wrapped!
  )
);

DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
CREATE POLICY "projects_update_policy" ON public.projects
FOR UPDATE
USING (
  -- Super admin: all projects
  is_super_admin()
  OR
  -- Founders: projects in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'  -- ✅ Already wrapped
  )
  OR
  -- Admins: their assigned project only
  id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'admin'  -- ✅ Already wrapped
  )
);

-- ============================================================================
-- FIX: spools table policy
-- ============================================================================

DROP POLICY IF EXISTS "spools_access_policy" ON public.spools;
CREATE POLICY "spools_access_policy" ON public.spools
FOR ALL
USING (
  project_id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid())  -- ✅ Now wrapped!
      AND project_id IS NOT NULL
  )
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())  -- ✅ Now wrapped!
  )
);

-- ============================================================================
-- Verification: check all policies now have wrapped auth.uid()
-- ============================================================================
-- Run this query AFTER migration to confirm all are fixed:
-- SELECT tablename, policyname
-- FROM pg_policies 
-- WHERE schemaname = 'public'
--   AND qual LIKE '%auth.uid()%' 
--   AND qual NOT LIKE '%(select auth.uid())%';
-- Expected result: 0 rows
