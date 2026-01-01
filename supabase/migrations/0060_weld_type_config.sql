-- =============================================
-- PHASE 6: Configurable Weld Types System
-- Migration 0060: Project-Level Weld Type Configuration
-- =============================================

-- Purpose:
-- "Welds" in spools_welds table actually includes ALL types of unions.
-- By default, ALL types require a welder.
-- This table allows configuring EXCEPTIONS (types that DON'T require welders):
-- - BW (Butt Weld), SW (Socket Weld) → Require welder ✅ (default)
-- - TW (Threaded), FL (Flanged), GR (Grooved) → NO welder needed ❌ (exception)
--
-- Design: Default = true (requires welder), only mark exceptions as false.

-- =============================================
-- 1. CREATE WELD TYPE CONFIG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS project_weld_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Type Definition
  type_code TEXT NOT NULL, -- BW, SW, TW, FL, GR, etc. (matches spools_welds.type_weld)
  type_name_es TEXT NOT NULL, -- Spanish name for UI
  type_name_en TEXT, -- English name (optional)
  
  -- Welder Requirement
  requires_welder BOOLEAN NOT NULL DEFAULT true,
  
  -- UI Display
  icon TEXT DEFAULT '🔗', -- Emoji or unicode char
  color TEXT DEFAULT '#6b7280', -- Hex color for badges
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, type_code),
  CHECK (length(type_code) >= 2 AND length(type_code) <= 10),
  CHECK (length(type_name_es) >= 2)
);

-- =============================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_weld_type_config_project ON project_weld_type_config(project_id);
CREATE INDEX idx_weld_type_config_company ON project_weld_type_config(company_id);
CREATE INDEX idx_weld_type_config_requires_welder ON project_weld_type_config(requires_welder);

-- =============================================
-- 3. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE project_weld_type_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view weld types" ON project_weld_type_config;
CREATE POLICY "Users can view weld types"
  ON project_weld_type_config
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage weld types" ON project_weld_type_config;
CREATE POLICY "Admins can manage weld types"
  ON project_weld_type_config
  FOR ALL
  USING (
    company_id IN (
      SELECT m.company_id 
      FROM members m
      LEFT JOIN company_roles cr ON m.functional_role_id = cr.id
      WHERE m.user_id = auth.uid() 
        AND (cr.base_role IN ('admin', 'founder') OR cr.base_role IS NULL)
    )
  );

-- =============================================
-- 4. TRIGGER: Auto-seed default weld types on project creation
-- =============================================

CREATE OR REPLACE FUNCTION seed_default_weld_types()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default weld types for the new project
  INSERT INTO project_weld_type_config (project_id, company_id, type_code, type_name_es, type_name_en, requires_welder, icon, color) VALUES
    (NEW.id, NEW.company_id, 'BW', 'Soldadura a Tope', 'Butt Weld', true, '🔥', '#ef4444'),
    (NEW.id, NEW.company_id, 'SW', 'Soldadura Socket', 'Socket Weld', true, '🔥', '#f97316'),
    (NEW.id, NEW.company_id, 'TW', 'Rosca', 'Threaded', false, '🔩', '#8b5cf6'),
    (NEW.id, NEW.company_id, 'FL', 'Brida', 'Flanged', false, '🔗', '#3b82f6'),
    (NEW.id, NEW.company_id, 'GR', 'Victaulic/Grooved', 'Grooved', false, '🔗', '#10b981'),
    (NEW.id, NEW.company_id, 'OTHER', 'Otro', 'Other', true, '❓', '#6b7280')
  ON CONFLICT (project_id, type_code) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seed_weld_types ON projects;
CREATE TRIGGER trg_seed_weld_types
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_weld_types();

-- =============================================
-- 5. BACKFILL: Seed weld types for existing projects
-- =============================================

DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id, company_id FROM projects LOOP
    INSERT INTO project_weld_type_config (project_id, company_id, type_code, type_name_es, type_name_en, requires_welder, icon, color) VALUES
      (project_record.id, project_record.company_id, 'BW', 'Soldadura a Tope', 'Butt Weld', true, '🔥', '#ef4444'),
      (project_record.id, project_record.company_id, 'SW', 'Soldadura Socket', 'Socket Weld', true, '🔥', '#f97316'),
      (project_record.id, project_record.company_id, 'TW', 'Rosca', 'Threaded', false, '🔩', '#8b5cf6'),
      (project_record.id, project_record.company_id, 'FL', 'Brida', 'Flanged', false, '🔗', '#3b82f6'),
      (project_record.id, project_record.company_id, 'GR', 'Victaulic/Grooved', 'Grooved', false, '🔗', '#10b981'),
      (project_record.id, project_record.company_id, 'OTHER', 'Otro', 'Other', true, '❓', '#6b7280')
    ON CONFLICT (project_id, type_code) DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- 6. HELPER FUNCTION: Get weld type config
-- =============================================

CREATE OR REPLACE FUNCTION get_weld_type_config(
  p_project_id UUID,
  p_type_code TEXT
)
RETURNS TABLE (
  requires_welder BOOLEAN,
  type_name_es TEXT,
  icon TEXT,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wtc.requires_welder,
    wtc.type_name_es,
    wtc.icon,
    wtc.color
  FROM project_weld_type_config wtc
  WHERE wtc.project_id = p_project_id 
    AND wtc.type_code = p_type_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- 7. VERIFICATION
-- =============================================

SELECT 
  'Migration 0060 complete' as status,
  COUNT(*) as weld_types_created
FROM project_weld_type_config;
