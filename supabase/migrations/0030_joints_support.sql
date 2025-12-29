-- Migration 0030: Bolted Joints Support
-- Enables uploading Bolted Joints (Juntas Apernadas) per spool/iso from Excel

-- =============================================
-- 1. SPOOLS_JOINTS TABLE (Bolted Joints)
-- =============================================

CREATE TABLE IF NOT EXISTS spools_joints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES engineering_revisions(id) ON DELETE CASCADE,
  spool_id UUID, -- Nullable, joints might be field joints not attached to a single shop spool
  company_id UUID NOT NULL REFERENCES companies(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Excel Columns
  iso_number TEXT NOT NULL, -- ISO NUMBER
  rev_number TEXT, -- REV
  line_number TEXT, -- LINE NUMBER
  sheet TEXT, -- SHEET
  joint_number TEXT NOT NULL, -- FLANGED JOINT NUMBER
  
  -- Spec & Material
  piping_class TEXT, -- PIPING CLASS
  material TEXT, -- MATERIAL
  rating TEXT, -- RATING (e.g., 150#, 300#)
  nps TEXT, -- NPS (Nominal Pipe Size)
  bolt_size TEXT, -- BOLT SIZE (e.g., 5/8" x 90mm)
  
  -- Metadata
  excel_row INTEGER, -- Row number from Excel for traceability
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE spools_joints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spools_joints_company_isolation" ON spools_joints
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =============================================
-- 3. INDEXES for Performance
-- =============================================

CREATE INDEX idx_spools_joints_revision ON spools_joints(revision_id);
CREATE INDEX idx_spools_joints_iso ON spools_joints(iso_number);
CREATE INDEX idx_spools_joints_line ON spools_joints(line_number);
CREATE INDEX idx_spools_joints_joint ON spools_joints(joint_number);

-- =============================================
-- 4. TRIGGER: Update timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_spools_joints_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_spools_joints_timestamp
  BEFORE UPDATE ON spools_joints
  FOR EACH ROW
  EXECUTE FUNCTION update_spools_joints_timestamp();

-- =============================================
-- 5. HELPER FUNCTION: Get Joints Summary by Revision
-- =============================================

CREATE OR REPLACE FUNCTION get_joints_summary(revision_id_param UUID)
RETURNS TABLE (
  bolt_size TEXT,
  rating TEXT,
  joints_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sj.bolt_size,
    sj.rating,
    COUNT(*) as joints_count
  FROM spools_joints sj
  WHERE sj.revision_id = revision_id_param
  GROUP BY sj.bolt_size, sj.rating
  ORDER BY sj.rating, sj.bolt_size;
END;
$$ LANGUAGE plpgsql;
