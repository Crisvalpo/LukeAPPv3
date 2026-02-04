-- Migration: Sync Members RLS Policies with Supabase Cloud
-- Date: 2026-02-04
-- Purpose: Replace limited local RLS policies with complete CRUD policies matching cloud

-- 0. Ensure helper function exists (needed by policies)
CREATE OR REPLACE FUNCTION public.get_my_company_ids_v2()
RETURNS TABLE (company_id uuid) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT m.company_id
    FROM public.members m
    WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Drop existing limited policies
DROP POLICY IF EXISTS "members_safe_select" ON public.members;
DROP POLICY IF EXISTS "Staff full access members" ON public.members;

-- 2. Create complete CRUD policies (matching Supabase Cloud)

-- SELECT: View own record, company members, or all if super admin
CREATE POLICY "members_select_policy" ON public.members
FOR SELECT
USING (
  is_super_admin()
  OR user_id = auth.uid()
  OR company_id IN (SELECT get_my_company_ids_v2())
);

-- INSERT: Add members to your company or all if super admin
CREATE POLICY "members_insert_policy" ON public.members
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR company_id IN (SELECT get_my_company_ids_v2())
);

-- UPDATE: Update your own profile or all if super admin
CREATE POLICY "members_update_policy" ON public.members
FOR UPDATE
USING (
  is_super_admin()
  OR user_id = auth.uid()
)
WITH CHECK (
  is_super_admin()
  OR user_id = auth.uid()
);

-- DELETE: Remove members from your company or all if super admin
CREATE POLICY "members_delete_policy" ON public.members
FOR DELETE
USING (
  is_super_admin()
  OR company_id IN (SELECT get_my_company_ids_v2())
);
