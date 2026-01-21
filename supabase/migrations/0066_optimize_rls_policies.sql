-- Migration 0066: Optimize RLS Policies for Performance
-- Purpose: Fix ~190 Supabase linter warnings by:
--   1. Wrapping auth.uid() calls with (select auth.uid())
--   2. Consolidating multiple permissive policies per table
-- Date: 2026-01-21

-- ============================================================================
-- STEP 1: Fix Helper Functions FIRST (they're used by multiple policies)
-- ============================================================================

-- Fix is_super_admin() - used in ~10 tables
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members 
    WHERE user_id = (select auth.uid())  -- ✅ Wrapped for performance
    AND role_id = 'super_admin'
  );
$$;

-- Fix get_my_company_ids_v2() - used in ~5 tables
CREATE OR REPLACE FUNCTION public.get_my_company_ids_v2()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT m.company_id
    FROM public.members m
    WHERE m.user_id = (select auth.uid());  -- ✅ Wrapped for performance
END;
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 'Optimized: uses (select auth.uid()) for RLS performance';
COMMENT ON FUNCTION public.get_my_company_ids_v2() IS 'Optimized: uses (select auth.uid()) for RLS performance';

-- ============================================================================
-- STEP 2: Consolidate & Optimize 'companies' table (4 → 3 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Staff full access companies" ON public.companies;
DROP POLICY IF EXISTS "Founder read own company" ON public.companies;
DROP POLICY IF EXISTS "Members can select their own company" ON public.companies;
DROP POLICY IF EXISTS "Founder update own company" ON public.companies;

-- Consolidated SELECT policy
CREATE POLICY "companies_select_policy" ON public.companies
FOR SELECT
USING (
  -- Super admin: full access
  is_super_admin()
  OR
  -- Founders: their company
  id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
  OR
  -- Members: their company
  id IN (SELECT get_my_company_ids_v2())
);

-- Consolidated UPDATE policy
CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE
USING (
  -- Super admin: full access
  is_super_admin()
  OR
  -- Founders: their company only
  id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);

-- INSERT and DELETE remain admin-only (via is_super_admin in ALL policy)
CREATE POLICY "companies_admin_all_policy" ON public.companies
FOR ALL
USING (is_super_admin());

-- ============================================================================
-- STEP 3: Consolidate & Optimize 'invitations' table (7 → 4 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Staff full access invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can delete invitations for their project" ON public.invitations;
DROP POLICY IF EXISTS "Admins can create invitations for their project" ON public.invitations;
DROP POLICY IF EXISTS "invitation_insert_by_role" ON public.invitations;
DROP POLICY IF EXISTS "Admins can view invitations for their project" ON public.invitations;
DROP POLICY IF EXISTS "Read own invitation by email" ON public.invitations;
DROP POLICY IF EXISTS "invitation_select_own_company" ON public.invitations;

-- Consolidated SELECT policy
CREATE POLICY "invitations_select_policy" ON public.invitations
FOR SELECT
USING (
  -- Super admin: all invitations
  is_super_admin()
  OR
  -- Read own invitation by email
  email = (auth.jwt() ->> 'email'::text)
  OR
  -- Founders: all invitations in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
  OR
  -- Admins: invitations for their project
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = (select auth.uid())
      AND role_id = 'admin'
      AND company_id = invitations.company_id
      AND project_id = invitations.project_id
  )
);

-- Consolidated INSERT policy
CREATE POLICY "invitations_insert_policy" ON public.invitations
FOR INSERT
WITH CHECK (
  -- Super admin: can invite anywhere
  is_super_admin()
  OR
  -- Founders: can invite to their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
  OR
  -- Admins: can invite to their project only
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = (select auth.uid())
      AND role_id = 'admin'
      AND company_id = invitations.company_id
      AND project_id = invitations.project_id
  )
);

-- Consolidated DELETE policy
CREATE POLICY "invitations_delete_policy" ON public.invitations
FOR DELETE
USING (
  -- Super admin: can delete any
  is_super_admin()
  OR
  -- Admins: can delete from their project
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = (select auth.uid())
      AND role_id = 'admin'
      AND company_id = invitations.company_id
      AND project_id = invitations.project_id
  )
);

-- No UPDATE policy needed (invitations are create/delete only)

-- ============================================================================
-- STEP 4: Consolidate & Optimize 'company_roles' table (4 → 4 policies, but optimized)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins full access to company roles" ON public.company_roles;
DROP POLICY IF EXISTS "Founders can manage their company roles" ON public.company_roles;
DROP POLICY IF EXISTS "Admins can view their company roles" ON public.company_roles;
DROP POLICY IF EXISTS "Members can view their company roles" ON public.company_roles;

-- Consolidated SELECT policy
CREATE POLICY "company_roles_select_policy" ON public.company_roles
FOR SELECT
USING (
  -- Super admin: all roles
  is_super_admin()
  OR
  -- Founders, Admins, Members: their company roles
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid())
  )
);

-- Consolidated INSERT policy
CREATE POLICY "company_roles_insert_policy" ON public.company_roles
FOR INSERT
WITH CHECK (
  -- Super admin: can create anywhere
  is_super_admin()
  OR
  -- Founders: can create in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);

-- Consolidated UPDATE policy
CREATE POLICY "company_roles_update_policy" ON public.company_roles
FOR UPDATE
USING (
  -- Super admin: can update any
  is_super_admin()
  OR
  -- Founders: can update in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);

-- Consolidated DELETE policy
CREATE POLICY "company_roles_delete_policy" ON public.company_roles
FOR DELETE
USING (
  -- Super admin: can delete any
  is_super_admin()
  OR
  -- Founders: can delete in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);

-- ============================================================================
-- STEP 5: Consolidate & Optimize 'material_request_items' table (7 → 5 policies)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "material_request_items_access" ON public.material_request_items;
DROP POLICY IF EXISTS "material_request_items_company_isolation" ON public.material_request_items;
DROP POLICY IF EXISTS "mri_permit_authenticated" ON public.material_request_items;
DROP POLICY IF EXISTS "mri_delete_policy" ON public.material_request_items;
DROP POLICY IF EXISTS "mri_insert_policy" ON public.material_request_items;
DROP POLICY IF EXISTS "mri_select_policy" ON public.material_request_items;
DROP POLICY IF EXISTS "mri_update_policy" ON public.material_request_items;

-- Consolidated SELECT policy
CREATE POLICY "material_request_items_select_policy" ON public.material_request_items
FOR SELECT
USING (
  -- Access through parent material_request
  EXISTS (
    SELECT 1 FROM material_requests mr
    JOIN projects p ON p.id = mr.project_id
    JOIN members m ON (m.project_id = p.id OR m.company_id = p.company_id)
    WHERE mr.id = material_request_items.request_id
      AND m.user_id = (select auth.uid())
  )
);

-- Consolidated INSERT policy
CREATE POLICY "material_request_items_insert_policy" ON public.material_request_items
FOR INSERT
WITH CHECK (
  -- Can insert if user has access to parent request's project
  EXISTS (
    SELECT 1 FROM material_requests mr
    JOIN projects p ON p.id = mr.project_id
    JOIN members m ON (m.project_id = p.id OR m.company_id = p.company_id)
    WHERE mr.id = material_request_items.request_id
      AND m.user_id = (select auth.uid())
  )
);

-- Consolidated UPDATE policy
CREATE POLICY "material_request_items_update_policy" ON public.material_request_items
FOR UPDATE
USING (
  -- Can update if user has access to parent request's project
  EXISTS (
    SELECT 1 FROM material_requests mr
    JOIN projects p ON p.id = mr.project_id
    JOIN members m ON (m.project_id = p.id OR m.company_id = p.company_id)
    WHERE mr.id = material_request_items.request_id
      AND m.user_id = (select auth.uid())
  )
);

-- Consolidated DELETE policy
CREATE POLICY "material_request_items_delete_policy" ON public.material_request_items
FOR DELETE
USING (
  -- Can delete if user has access to parent request's project
  EXISTS (
    SELECT 1 FROM material_requests mr
    JOIN projects p ON p.id = mr.project_id
    JOIN members m ON (m.project_id = p.id OR m.company_id = p.company_id)
    WHERE mr.id = material_request_items.request_id
      AND m.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- STEP 6: Optimize remaining critical tables with auth.uid() wrapping
-- ============================================================================

-- Projects table
DROP POLICY IF EXISTS "projects_manage" ON public.projects;
DROP POLICY IF EXISTS "project_access_by_role" ON public.projects;
DROP POLICY IF EXISTS "admin_update_own_project" ON public.projects;

CREATE POLICY "projects_select_policy" ON public.projects
FOR SELECT
USING (
  -- Super admin: all projects
  is_super_admin()
  OR
  -- Founders: projects in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
  OR
  -- Project-scoped roles: their assigned project
  id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid()) AND project_id IS NOT NULL
  )
);

CREATE POLICY "projects_update_policy" ON public.projects
FOR UPDATE
USING (
  -- Super admin: all projects
  is_super_admin()
  OR
  -- Founders: projects in their company
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
  OR
  -- Admins: their assigned project only
  id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'admin'
  )
);

-- Material Receipts - optimize auth.uid() calls
DROP POLICY IF EXISTS "material_receipts_select" ON public.material_receipts;
DROP POLICY IF EXISTS "material_receipts_insert" ON public.material_receipts;
DROP POLICY IF EXISTS "material_receipts_update" ON public.material_receipts;
DROP POLICY IF EXISTS "material_receipts_delete" ON public.material_receipts;

CREATE POLICY "material_receipts_access_policy" ON public.material_receipts
FOR ALL
USING (
  project_id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid())
      AND project_id IS NOT NULL
  )
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

-- Material Inventory - optimize auth.uid() calls
DROP POLICY IF EXISTS "material_inventory_select" ON public.material_inventory;
DROP POLICY IF EXISTS "material_inventory_modify" ON public.material_inventory;

CREATE POLICY "material_inventory_access_policy" ON public.material_inventory
FOR ALL
USING (
  project_id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid())
      AND project_id IS NOT NULL
  )
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

-- Spools - optimize auth.uid() wrapping
DROP POLICY IF EXISTS "Users can view spools" ON public.spools;
DROP POLICY IF EXISTS "Users can manage spools" ON public.spools;

CREATE POLICY "spools_access_policy" ON public.spools
FOR ALL
USING (
  project_id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid())
      AND project_id IS NOT NULL
  )
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

-- Joint Status History - optimize auth.uid() wrapping
DROP POLICY IF EXISTS "Joint history access policy" ON public.joint_status_history;

CREATE POLICY "joint_status_history_access_policy" ON public.joint_status_history
FOR ALL
USING (
  project_id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid())
      AND project_id IS NOT NULL
  )
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

-- Weld Status History - optimize auth.uid() wrapping
DROP POLICY IF EXISTS "Users can view weld history" ON public.weld_status_history;
DROP POLICY IF EXISTS "Users can insert weld history" ON public.weld_status_history;

CREATE POLICY "weld_status_history_access_policy" ON public.weld_status_history
FOR ALL
USING (
  project_id IN (
    SELECT project_id FROM members
    WHERE user_id = (select auth.uid())
      AND project_id IS NOT NULL
  )
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- VERIFICATION QUERIES (Comment out in production, use for testing)
-- ============================================================================

-- Uncomment to verify policy count reduction:
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY policy_count DESC;

-- Uncomment to check for unwrapped auth.uid() calls:
-- SELECT tablename, policyname
-- FROM pg_policies 
-- WHERE schemaname = 'public'
--   AND qual LIKE '%auth.uid()%' 
--   AND qual NOT LIKE '%(select auth.uid())%';
