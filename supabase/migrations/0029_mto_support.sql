-- Migration 0029: MTO (Material Take-Off) Support
-- Enables uploading Bill of Materials per spool from Excel format

-- =============================================
-- 1. SPOOLS_MTO TABLE (Material Take-Off / BOM)
-- =============================================

CREATE TABLE IF NOT EXISTS spools_mto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES engineering_revisions(id) ON DELETE CASCADE,
  spool_id UUID, -- Nullable until spools table exists
  company_id UUID NOT NULL REFERENCES companies(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Excel Columns (Original)
  line_number TEXT NOT NULL, -- LINE NUMBER (Piping Line, e.g., BBD-380-0403-1)
  area TEXT, -- AREA
  sheet TEXT, -- SHEET
  spool_number TEXT NOT NULL, -- SPOOL NUMBER (SP01, SP02, SPXX)
  spool_full_id TEXT, -- SPOOL-ID (Full: [Isométrico]-[Spool], e.g., 3800AE-BBD-380-0403-1-SP01)
  piping_class TEXT, -- PIPING CLASS
  rev_number TEXT, -- REV from Excel
  
  -- Derived field (extracted from spool_full_id)
  isometric_number TEXT, -- Extracted ISO from SPOOL-ID (e.g., 3800AE-BBD-380-0403-1)
  
  -- Material Information
  item_code TEXT NOT NULL, -- ITEM CODE (I63242705, WE01-2"-A-FAB-160-CS8, etc.)
  
  -- Quantities
  qty DECIMAL(10,3) NOT NULL DEFAULT 1 CHECK (qty > 0),
  qty_unit TEXT DEFAULT 'PCS', -- M (meters), PCS (pieces), KG, etc.
  
  -- Fabrication Type
  fab_type TEXT CHECK (fab_type IN ('F', 'G')), -- F=Fabrication, G=General/Support
  
  -- Metadata
  excel_row INTEGER, -- Row number from Excel for traceability
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE spools_mto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spools_mto_company_isolation" ON spools_mto
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =============================================
-- 3. INDEXES for Performance
-- =============================================

CREATE INDEX idx_spools_mto_revision ON spools_mto(revision_id);
CREATE INDEX idx_spools_mto_spool ON spools_mto(spool_id);
CREATE INDEX idx_spools_mto_line_number ON spools_mto(line_number);
CREATE INDEX idx_spools_mto_spool_number ON spools_mto(spool_number);
CREATE INDEX idx_spools_mto_item_code ON spools_mto(item_code);
CREATE INDEX idx_spools_mto_fab_type ON spools_mto(fab_type);
CREATE INDEX idx_spools_mto_isometric ON spools_mto(isometric_number);

-- =============================================
-- 4. TRIGGER: Extract Isometric from SPOOL-ID
-- =============================================

-- Extracts isometric number from spool_full_id
-- Example: "3800AE-BBD-380-0403-1-SP01" -> "3800AE-BBD-380-0403-1"
CREATE OR REPLACE FUNCTION extract_isometric_from_spool_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.spool_full_id IS NOT NULL AND NEW.spool_number IS NOT NULL THEN
    -- Remove the last occurrence of "-[SPOOL_NUMBER]" from spool_full_id
    NEW.isometric_number = REPLACE(NEW.spool_full_id, '-' || NEW.spool_number, '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER extract_iso_before_insert
  BEFORE INSERT OR UPDATE ON spools_mto
  FOR EACH ROW
  EXECUTE FUNCTION extract_isometric_from_spool_id();

-- =============================================
-- 5. TRIGGER: Update timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_spools_mto_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_spools_mto_timestamp
  BEFORE UPDATE ON spools_mto
  FOR EACH ROW
  EXECUTE FUNCTION update_spools_mto_timestamp();

-- =============================================
-- 5. HELPER FUNCTION: Get MTO Summary by Revision
-- =============================================

CREATE OR REPLACE FUNCTION get_mto_summary(revision_id_param UUID)
RETURNS TABLE (
  item_code TEXT,
  total_qty DECIMAL,
  qty_unit TEXT,
  fab_type TEXT,
  spools_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.item_code,
    SUM(sm.qty) as total_qty,
    sm.qty_unit,
    sm.fab_type,
    COUNT(DISTINCT sm.spool_number) as spools_count
  FROM spools_mto sm
  WHERE sm.revision_id = revision_id_param
  GROUP BY sm.item_code, sm.qty_unit, sm.fab_type
  ORDER BY sm.fab_type, sm.item_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. HELPER FUNCTION: Get MTO by Spool
-- =============================================

CREATE OR REPLACE FUNCTION get_spool_mto(
  revision_id_param UUID,
  spool_number_param TEXT
)
RETURNS TABLE (
  item_code TEXT,
  qty DECIMAL,
  qty_unit TEXT,
  fab_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.item_code,
    sm.qty,
    sm.qty_unit,
    sm.fab_type
  FROM spools_mto sm
  WHERE sm.revision_id = revision_id_param
    AND sm.spool_number = spool_number_param
  ORDER BY sm.item_code;
END;
$$ LANGUAGE plpgsql;
