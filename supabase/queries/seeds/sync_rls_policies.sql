-- RLS Policy Synchronization from Cloud to Local
-- This migration enables RLS and creates all missing policies

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC.USERS POLICIES
-- ============================================

-- Policy: users_read_own
-- Users can read their own profile
CREATE POLICY users_read_own ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Policy: users_staff_read_all
-- Super admins can read all user profiles
CREATE POLICY users_staff_read_all ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM members m
            WHERE m.user_id = auth.uid()
            AND m.role_id = 'super_admin'::user_role
        )
    );

-- Policy: users_update_own
-- Users can update their own profile
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (id = auth.uid());

-- ============================================
-- PUBLIC.MEMBERS POLICIES
-- ============================================

-- Policy: members_select_policy
-- Users can view their own membership, super admins can view all, 
-- and users can view members in their companies
CREATE POLICY members_select_policy ON public.members
    FOR SELECT
    USING (
        is_super_admin()
        OR user_id = auth.uid()
        OR company_id IN (SELECT get_my_company_ids_v2())
    );

-- Policy: members_insert_policy
-- Super admins and company admins can create new members
CREATE POLICY members_insert_policy ON public.members
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR company_id IN (SELECT get_my_company_ids_v2())
    );

-- Policy: members_update_policy
-- Users can update their own membership, super admins can update all
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
-- Super admins and company admins can delete members
CREATE POLICY members_delete_policy ON public.members
    FOR DELETE
    USING (
        is_super_admin()
        OR company_id IN (SELECT get_my_company_ids_v2())
    );
