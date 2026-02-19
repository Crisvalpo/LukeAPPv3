-- ============================================================
-- FIX: RLS Policies for Document Control tables
-- PostgreSQL < 16 doesn't support CREATE POLICY IF NOT EXISTS
-- ============================================================

-- Drop any partial policies first (safe: they don't exist yet)
DO $$ 
DECLARE
    tbl text;
    policies text[] := ARRAY[
        'document_types', 'project_document_config', 'document_master',
        'document_revisions', 'transmittals', 'transmittal_items', 'document_event_log'
    ];
BEGIN
    FOREACH tbl IN ARRAY policies LOOP
        -- Try drop, ignore if not exists
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "super_admin_all_%1$s" ON %1$s', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "company_access_%1$s" ON %1$s', tbl);
        EXCEPTION WHEN undefined_object THEN NULL;
        END;
    END LOOP;
END $$;

-- Super admin policies
CREATE POLICY "super_admin_all_document_types" ON document_types FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "super_admin_all_project_document_config" ON project_document_config FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "super_admin_all_document_master" ON document_master FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "super_admin_all_document_revisions" ON document_revisions FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "super_admin_all_transmittals" ON transmittals FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "super_admin_all_transmittal_items" ON transmittal_items FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "super_admin_all_document_event_log" ON document_event_log FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true));

-- Company-scoped access policies
CREATE POLICY "company_access_document_types" ON document_types FOR ALL
    USING (company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "company_access_project_document_config" ON project_document_config FOR ALL
    USING (company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "company_access_document_master" ON document_master FOR ALL
    USING (company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "company_access_document_revisions" ON document_revisions FOR ALL
    USING (company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "company_access_transmittals" ON transmittals FOR ALL
    USING (company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "company_access_transmittal_items" ON transmittal_items FOR ALL
    USING (
        transmittal_id IN (
            SELECT id FROM transmittals 
            WHERE company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "company_access_document_event_log" ON document_event_log FOR ALL
    USING (company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid()));
