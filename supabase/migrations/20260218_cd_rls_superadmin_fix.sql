-- ============================================================
-- FIX: Super admin RLS policies using is_super_admin() function
-- The function already exists (migration 0066)
-- ============================================================

-- Ensure the function exists
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = (SELECT auth.uid())
    AND role_id = 'super_admin'
  );
$$;

-- Drop any partial policies and recreate
DROP POLICY IF EXISTS "super_admin_all_document_types" ON document_types;
DROP POLICY IF EXISTS "super_admin_all_project_document_config" ON project_document_config;
DROP POLICY IF EXISTS "super_admin_all_document_master" ON document_master;
DROP POLICY IF EXISTS "super_admin_all_document_revisions" ON document_revisions;
DROP POLICY IF EXISTS "super_admin_all_transmittals" ON transmittals;
DROP POLICY IF EXISTS "super_admin_all_transmittal_items" ON transmittal_items;
DROP POLICY IF EXISTS "super_admin_all_document_event_log" ON document_event_log;

CREATE POLICY "super_admin_all_document_types" ON document_types FOR ALL USING (is_super_admin());
CREATE POLICY "super_admin_all_project_document_config" ON project_document_config FOR ALL USING (is_super_admin());
CREATE POLICY "super_admin_all_document_master" ON document_master FOR ALL USING (is_super_admin());
CREATE POLICY "super_admin_all_document_revisions" ON document_revisions FOR ALL USING (is_super_admin());
CREATE POLICY "super_admin_all_transmittals" ON transmittals FOR ALL USING (is_super_admin());
CREATE POLICY "super_admin_all_transmittal_items" ON transmittal_items FOR ALL USING (is_super_admin());
CREATE POLICY "super_admin_all_document_event_log" ON document_event_log FOR ALL USING (is_super_admin());
