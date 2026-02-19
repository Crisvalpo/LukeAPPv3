-- FIX: Grant missing SQL permissions to authenticated users for role management
-- This allows Founders/Admins to perform INSERT/UPDATE/DELETE operations via the API

GRANT INSERT, UPDATE, DELETE ON public.company_roles TO authenticated;

-- Ensure RLS policies for deletion are correctly set
-- Drop existing policy if any to avoid conflicts
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
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);

-- Also ensure INSERT/UPDATE have similar robust checks (redundancy check)
DROP POLICY IF EXISTS "company_roles_insert_policy" ON public.company_roles;
CREATE POLICY "company_roles_insert_policy" ON public.company_roles
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);

DROP POLICY IF EXISTS "company_roles_update_policy" ON public.company_roles;
CREATE POLICY "company_roles_update_policy" ON public.company_roles
FOR UPDATE
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = (select auth.uid()) AND role_id = 'founder'
  )
);
