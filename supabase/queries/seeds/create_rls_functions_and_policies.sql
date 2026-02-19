-- Create required helper functions for RLS policies

-- Function: is_super_admin()
-- Checks if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.members 
    WHERE user_id = (select auth.uid())
    AND role_id = 'super_admin'
  );
$function$;

-- Function: get_my_company_ids_v2()
-- Returns all company IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.get_my_company_ids_v2()
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT m.company_id
    FROM public.members m
    WHERE m.user_id = (select auth.uid());
END;
$function$;

-- ============================================
-- PUBLIC.MEMBERS POLICIES
-- ============================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS members_select_policy ON public.members;
DROP POLICY IF EXISTS members_insert_policy ON public.members;
DROP POLICY IF EXISTS members_update_policy ON public.members;
DROP POLICY IF EXISTS members_delete_policy ON public.members;

-- Policy: members_select_policy
CREATE POLICY members_select_policy ON public.members
    FOR SELECT
    USING (
        is_super_admin()
        OR user_id = auth.uid()
        OR company_id IN (SELECT get_my_company_ids_v2())
    );

-- Policy: members_insert_policy
CREATE POLICY members_insert_policy ON public.members
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR company_id IN (SELECT get_my_company_ids_v2())
    );

-- Policy: members_update_policy
CREATE POLICY members_update_policy ON public.members
    FOR UPDATE
    USING (
        is_super_admin()
        OR user_id = auth.uid()
    )
    WITH CHECK (
        is_super_admin()
        OR user_id = auth.uid()
    );

-- Policy: members_delete_policy
CREATE POLICY members_delete_policy ON public.members
    FOR DELETE
    USING (
        is_super_admin()
        OR company_id IN (SELECT get_my_company_ids_v2())
    );
