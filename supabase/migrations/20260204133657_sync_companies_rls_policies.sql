-- Migration: Sync Companies RLS Policies with Cloud
-- Date: 2026-02-04
-- Purpose: Add missing SELECT policy to allow founders to view their companies

-- 1. Drop the old ALL policy (it will be replaced by specific policies)
DROP POLICY IF EXISTS "Staff full access companies" ON public.companies;

-- 2. Create specific CRUD policies (matching Cloud)

-- SELECT: Super admins, founders of the company, or members via helper function
CREATE POLICY "companies_select_policy" ON public.companies
FOR SELECT
USING (
  is_super_admin()
  OR 
  -- Founders can see their own company
  id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid() 
    AND role_id IN ('founder', 'admin')
  )
  OR
  -- Other members can see their company via helper function
  id IN (SELECT get_my_company_ids_v2())
);

-- INSERT: Only super admins
CREATE POLICY "companies_insert_policy" ON public.companies
FOR INSERT
WITH CHECK (is_super_admin());

-- UPDATE: Super admins or founders of the company
CREATE POLICY "companies_update_policy" ON public.companies
FOR UPDATE
USING (
  is_super_admin()
  OR
  -- Founders can update their own company
  id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid() 
    AND role_id = 'founder'
  )
);

-- DELETE: Only super admins
CREATE POLICY "companies_delete_policy" ON public.companies
FOR DELETE
USING (is_super_admin());
