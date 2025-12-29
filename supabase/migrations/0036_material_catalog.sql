-- Migration 0036: Material Catalog (Project-Scoped)
-- Enables storing material master data with descriptions and specifications

-- =============================================
-- 1. MATERIAL_CATALOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS material_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Material Identification
  ident_code TEXT NOT NULL, -- e.g., "I68026820"
  
  -- Descriptions
  short_desc TEXT NOT NULL, -- Short description
  long_desc TEXT, -- Full technical description
  short_code TEXT, -- Short code (optional)
  
  -- Classification
  commodity_code TEXT,
  spec_code TEXT,
  commodity_group TEXT,
  part_group TEXT, -- e.g., "MET Pipes and Tubes", "MET Valves"
  sap_mat_grp TEXT, -- SAP Material Group
  
  -- Physical Properties
  unit_weight DECIMAL(10,3), -- Weight per unit
  
  -- Custom Fields (Extensible)
  custom_fields JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_ident_per_project UNIQUE(project_id, ident_code)
);

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX idx_material_catalog_project ON material_catalog(project_id);
CREATE INDEX idx_material_catalog_ident ON material_catalog(ident_code);
CREATE INDEX idx_material_catalog_commodity ON material_catalog(commodity_code);
CREATE INDEX idx_material_catalog_part_group ON material_catalog(part_group);

-- =============================================
-- 3. RLS POLICIES
-- =============================================

ALTER TABLE material_catalog ENABLE ROW LEVEL SECURITY;

-- Company isolation policy
CREATE POLICY "material_catalog_company_isolation" ON material_catalog
  FOR ALL 
  USING (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 4. TRIGGER: Updated timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_material_catalog_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_material_catalog_timestamp
  BEFORE UPDATE ON material_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_material_catalog_timestamp();
