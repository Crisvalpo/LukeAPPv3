-- ============================================================
-- MIGRATION: cd_engineering_bridge
-- PURPOSE: Bridge Document Control ↔ Engineering workflow
--
-- Changes:
-- 1. Split isometrics.status into revision_status + spooling_status
-- 2. Add bridge FKs (isometrics ↔ document_master, engineering_revisions ↔ document_revisions)
-- 3. Add spooling tracking fields to engineering_revisions
-- ============================================================

-- ===== 1. DUAL STATUS SYSTEM ON ISOMETRICS =====

-- Add new columns
ALTER TABLE isometrics 
ADD COLUMN IF NOT EXISTS revision_status text NOT NULL DEFAULT 'VIGENTE',
ADD COLUMN IF NOT EXISTS spooling_status text NOT NULL DEFAULT 'SIN_SPOOLEAR';

-- Migrate data from old status to new dual columns
UPDATE isometrics SET 
    revision_status = CASE
        WHEN status IN ('VIGENTE', 'VIGENTE_SPOOLEADO') THEN 'VIGENTE'
        WHEN status IN ('OBSOLETO', 'OBSOLETO_SPOOLEADO') THEN 'OBSOLETA'
        WHEN status IN ('ELIMINADO', 'ELIMINADO_SPOOLEADO') THEN 'ELIMINADA'
        WHEN status = 'EN_EJECUCION' THEN 'VIGENTE'
        WHEN status = 'TERMINADA' THEN 'VIGENTE'
        ELSE 'VIGENTE'
    END,
    spooling_status = CASE
        WHEN status IN ('VIGENTE_SPOOLEADO', 'OBSOLETO_SPOOLEADO', 'ELIMINADO_SPOOLEADO') THEN 'SPOOLEADO'
        WHEN status = 'EN_EJECUCION' THEN 'SPOOLEADO'
        WHEN status = 'TERMINADA' THEN 'SPOOLEADO'
        ELSE 'SIN_SPOOLEAR'
    END;

-- Add check constraints for valid values
ALTER TABLE isometrics
ADD CONSTRAINT chk_revision_status 
    CHECK (revision_status IN ('VIGENTE', 'OBSOLETA', 'ELIMINADA')),
ADD CONSTRAINT chk_spooling_status 
    CHECK (spooling_status IN ('SIN_SPOOLEAR', 'EN_PROCESO', 'SPOOLEADO', 'SPOOLEADO_MANUAL'));

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_iso_revision_status ON isometrics(revision_status);
CREATE INDEX IF NOT EXISTS idx_iso_spooling_status ON isometrics(spooling_status);

-- ===== 2. BRIDGE FOREIGN KEYS =====

-- Link isometrics to document_master
ALTER TABLE isometrics 
ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES document_master(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_iso_document_id ON isometrics(document_id);

-- Link engineering_revisions to document_revisions
ALTER TABLE engineering_revisions 
ADD COLUMN IF NOT EXISTS document_revision_id uuid REFERENCES document_revisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eng_rev_doc_rev ON engineering_revisions(document_revision_id);

-- ===== 3. SPOOLING TRACKING FIELDS ON ENGINEERING_REVISIONS =====

ALTER TABLE engineering_revisions
ADD COLUMN IF NOT EXISTS spooling_date timestamptz,
ADD COLUMN IF NOT EXISTS delivery_date timestamptz,
ADD COLUMN IF NOT EXISTS delivery_transmittal_code text;

-- ===== 4. ADD TRANSMITTAL DIRECTION TYPE =====
-- Transmittals can be INCOMING (from client) or OUTGOING (to field/client)

ALTER TABLE transmittals
ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'INCOMING'
    CHECK (direction IN ('INCOMING', 'OUTGOING'));

-- ===== 5. GRANTS =====

GRANT SELECT, INSERT, UPDATE, DELETE ON isometrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON engineering_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_master TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_event_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transmittals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transmittal_items TO authenticated;
