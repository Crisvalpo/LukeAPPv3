-- Migration: Create project_locations table
-- Based on PIPING-REF design, adapted for LukeAPP multi-tenant architecture
-- Created: 2024-12-31
-- Description: Configurable locations per project (workshops, storage, field sites)

-- Create table
CREATE TABLE IF NOT EXISTS project_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  code TEXT, -- Short code: "BC", "TP", "TER"
  type TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  
  -- Hierarchy (optional - for Bodega → Sector → Rack)
  parent_location_id UUID REFERENCES project_locations(id) ON DELETE SET NULL,
  
  -- Metadata
  capacity INTEGER, -- Max spools capacity
  gps_coords JSONB, -- {lat: number, lng: number}
  custom_metadata JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unique_location_name_per_project UNIQUE(project_id, name),
  CONSTRAINT valid_location_type CHECK (
    type IN ('workshop', 'storage', 'field', 'transit', 'installed', 'other')
  )
);

-- Unique partial index for codes (only when not null)
CREATE UNIQUE INDEX unique_location_code_per_project 
  ON project_locations(project_id, code) 
  WHERE code IS NOT NULL;

-- Indexes for performance
CREATE INDEX idx_project_locations_project ON project_locations(project_id);
CREATE INDEX idx_project_locations_company ON project_locations(company_id);
CREATE INDEX idx_project_locations_type ON project_locations(type);
CREATE INDEX idx_project_locations_parent ON project_locations(parent_location_id) WHERE parent_location_id IS NOT NULL;
CREATE INDEX idx_project_locations_active ON project_locations(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Company-level access
DROP POLICY IF EXISTS project_locations_company_access ON project_locations;
CREATE POLICY project_locations_company_access 
ON project_locations
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM members WHERE user_id = auth.uid()
  )
);

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_project_locations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_locations_timestamp ON project_locations;
CREATE TRIGGER trigger_update_project_locations_timestamp
  BEFORE UPDATE ON project_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_project_locations_timestamp();

-- Function: Auto-seed default locations for new projects
CREATE OR REPLACE FUNCTION seed_default_project_locations()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert 7 default locations
  INSERT INTO project_locations (project_id, company_id, name, code, type, description)
  VALUES
    (NEW.id, NEW.company_id, 'Bodega Principal', 'BDP', 'storage', 'Bodega principal de almacenamiento'),
    (NEW.id, NEW.company_id, 'Taller Prefabricación', 'TP', 'workshop', 'Área de prefabricación de spools'),
    (NEW.id, NEW.company_id, 'Taller Soldadura', 'TS', 'workshop', 'Área de soldadura'),
    (NEW.id, NEW.company_id, 'Pintura', 'PINT', 'workshop', 'Área de pintura y acabado'),
    (NEW.id, NEW.company_id, 'Terreno', 'TER', 'field', 'Área de montaje en sitio'),
    (NEW.id, NEW.company_id, 'En Tránsito', 'TRAN', 'transit', 'Spools en transporte'),
    (NEW.id, NEW.company_id, 'Instalado', 'INST', 'installed', 'Spools instalados y liberados');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-seed on project creation
DROP TRIGGER IF EXISTS trigger_seed_project_locations ON projects;
CREATE TRIGGER trigger_seed_project_locations
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_project_locations();

-- Seed locations for EXISTING projects (one-time backfill)
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id, company_id FROM projects LOOP
    -- Check if project already has locations
    IF NOT EXISTS (SELECT 1 FROM project_locations WHERE project_id = project_record.id) THEN
      INSERT INTO project_locations (project_id, company_id, name, code, type, description)
      VALUES
        (project_record.id, project_record.company_id, 'Bodega Principal', 'BDP', 'storage', 'Bodega principal de almacenamiento'),
        (project_record.id, project_record.company_id, 'Taller Prefabricación', 'TP', 'workshop', 'Área de prefabricación de spools'),
        (project_record.id, project_record.company_id, 'Taller Soldadura', 'TS', 'workshop', 'Área de soldadura'),
        (project_record.id, project_record.company_id, 'Pintura', 'PINT', 'workshop', 'Área de pintura y acabado'),
        (project_record.id, project_record.company_id, 'Terreno', 'TER', 'field', 'Área de montaje en sitio'),
        (project_record.id, project_record.company_id, 'En Tránsito', 'TRAN', 'transit', 'Spools en transporte'),
        (project_record.id, project_record.company_id, 'Instalado', 'INST', 'installed', 'Spools instalados y liberados');
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Default locations seeded for all existing projects';
END $$;

-- Add location reference to spools table
ALTER TABLE spools ADD COLUMN IF NOT EXISTS current_location_id UUID REFERENCES project_locations(id) ON DELETE SET NULL;
ALTER TABLE spools ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;
ALTER TABLE spools ADD COLUMN IF NOT EXISTS location_updated_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_spools_location ON spools(current_location_id);

-- Comments
COMMENT ON TABLE project_locations IS 'Configurable locations per project (workshops, storage, field sites, etc.)';
COMMENT ON COLUMN project_locations.type IS 'Type: workshop, storage, field, transit, installed, other';
COMMENT ON COLUMN project_locations.parent_location_id IS 'For hierarchical locations (e.g., Bodega → Sector A → Rack 15)';
COMMENT ON COLUMN project_locations.code IS 'Short code for easy identification (3-4 chars)';
COMMENT ON COLUMN project_locations.capacity IS 'Optional maximum spool capacity';

-- Verification query
SELECT 
  p.name AS project_name,
  COUNT(pl.id) AS total_locations,
  STRING_AGG(DISTINCT pl.type, ', ') AS location_types
FROM projects p
LEFT JOIN project_locations pl ON pl.project_id = p.id
GROUP BY p.id, p.name
ORDER BY p.name;
