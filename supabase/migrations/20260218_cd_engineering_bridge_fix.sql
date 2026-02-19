-- ============================================================
-- MIGRATION FIX: cd_engineering_bridge_fix
-- PURPOSE: 
--   1. Create document_control foundation tables (if missing)
--   2. Apply bridge FKs that failed in the first attempt
--   3. Handle missing 'status' column migration safely
-- ============================================================

-- ===== 1. DOCUMENT CONTROL FOUNDATION TABLES =====

-- Document Types (catalog)
CREATE TABLE IF NOT EXISTS document_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(company_id, code)
);

-- Project Document Config
CREATE TABLE IF NOT EXISTS project_document_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    coding_pattern text NOT NULL DEFAULT '{PROJECT_CODE}-{DOC_TYPE}-{SPECIALTY}-{SEQ}',
    next_sequence integer NOT NULL DEFAULT 1,
    is_frozen boolean NOT NULL DEFAULT false,
    frozen_at timestamptz,
    frozen_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(project_id)
);

-- Document Master
CREATE TABLE IF NOT EXISTS document_master (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type_id uuid NOT NULL REFERENCES document_types(id),
    specialty_id uuid REFERENCES specialties(id),
    document_code text NOT NULL,
    title text NOT NULL,
    description text,
    current_revision_id uuid,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'ON_HOLD')),
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(project_id, document_code)
);

-- Document Revisions
CREATE TABLE IF NOT EXISTS document_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES document_master(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rev_code text NOT NULL,
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
    file_url text,
    file_name text,
    file_size bigint,
    notes text,
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamptz,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(document_id, rev_code)
);

-- Transmittals
CREATE TABLE IF NOT EXISTS transmittals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transmittal_code text NOT NULL,
    title text,
    recipient text,
    notes text,
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACKNOWLEDGED')),
    sent_at timestamptz,
    sent_by uuid REFERENCES auth.users(id),
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(project_id, transmittal_code)
);

-- Transmittal Items
CREATE TABLE IF NOT EXISTS transmittal_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transmittal_id uuid NOT NULL REFERENCES transmittals(id) ON DELETE CASCADE,
    document_revision_id uuid NOT NULL REFERENCES document_revisions(id),
    purpose text NOT NULL DEFAULT 'FOR_APPROVAL' CHECK (purpose IN ('FOR_APPROVAL', 'FOR_INFORMATION', 'FOR_CONSTRUCTION', 'AS_BUILT')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(transmittal_id, document_revision_id)
);

-- Document Event Log
CREATE TABLE IF NOT EXISTS document_event_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES document_master(id) ON DELETE CASCADE,
    revision_id uuid REFERENCES document_revisions(id),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}',
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== 2. RLS on all document_control tables =====

ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_document_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmittal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_event_log ENABLE ROW LEVEL SECURITY;

-- Super admin policies (allow all for super_admin)
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'document_types', 'project_document_config', 'document_master',
        'document_revisions', 'transmittals', 'transmittal_items', 'document_event_log'
    ]) LOOP
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "super_admin_all_%1$s"
            ON %1$s FOR ALL
            USING (
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
            )', tbl);
    END LOOP;
END $$;

-- Company-scoped access policies
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'document_types', 'project_document_config', 'document_master',
        'document_revisions', 'transmittals', 'document_event_log'
    ]) LOOP
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "company_access_%1$s"
            ON %1$s FOR ALL
            USING (
                company_id IN (
                    SELECT company_id FROM members WHERE user_id = auth.uid()
                )
            )', tbl);
    END LOOP;
END $$;

-- Transmittal items (access via transmittal)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transmittal_items' AND policyname = 'company_access_transmittal_items') THEN
        CREATE POLICY "company_access_transmittal_items"
        ON transmittal_items FOR ALL
        USING (
            transmittal_id IN (
                SELECT id FROM transmittals 
                WHERE company_id IN (
                    SELECT company_id FROM members WHERE user_id = auth.uid()
                )
            )
        );
    END IF;
END $$;

-- ===== 3. INDEXES on document_control tables =====

CREATE INDEX IF NOT EXISTS idx_doc_master_project ON document_master(project_id);
CREATE INDEX IF NOT EXISTS idx_doc_master_type ON document_master(document_type_id);
CREATE INDEX IF NOT EXISTS idx_doc_master_company ON document_master(company_id);
CREATE INDEX IF NOT EXISTS idx_doc_revisions_document ON document_revisions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_revisions_project ON document_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_transmittals_project ON transmittals(project_id);
CREATE INDEX IF NOT EXISTS idx_doc_events_document ON document_event_log(document_id);

-- ===== 4. BRIDGE FOREIGN KEYS (failed in first attempt) =====

-- Link isometrics to document_master
ALTER TABLE isometrics 
ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES document_master(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_iso_document_id ON isometrics(document_id);

-- Link engineering_revisions to document_revisions
ALTER TABLE engineering_revisions 
ADD COLUMN IF NOT EXISTS document_revision_id uuid REFERENCES document_revisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eng_rev_doc_rev ON engineering_revisions(document_revision_id);

-- ===== 5. SPOOLING TRACKING on engineering_revisions =====

ALTER TABLE engineering_revisions
ADD COLUMN IF NOT EXISTS spooling_date timestamptz,
ADD COLUMN IF NOT EXISTS delivery_date timestamptz,
ADD COLUMN IF NOT EXISTS delivery_transmittal_code text;

-- ===== 6. TRANSMITTAL DIRECTION =====

ALTER TABLE transmittals
ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'INCOMING'
    CHECK (direction IN ('INCOMING', 'OUTGOING'));

-- ===== 7. GRANTS =====

GRANT SELECT, INSERT, UPDATE, DELETE ON document_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_document_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_master TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_event_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transmittals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transmittal_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON isometrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON engineering_revisions TO authenticated;
