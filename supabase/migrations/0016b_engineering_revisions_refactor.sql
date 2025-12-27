/**
 * MIGRATION 0016b - Engineering Revisions Refactor (Adjusted for Existing Schema)
 * 
 * Creates revision-based architecture on top of existing tables.
 * Compatible with schema after 0016a migration.
 * 
 * BEFORE RUNNING:
 * - Ensure 0016a (PIPING compatibility) was executed successfully
 * - Backup completed via npx tsx scripts/backup_engineering_data.ts
 */

-- =====================================================
-- PART 1: CREATE ENGINEERING_REVISIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.engineering_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  isometric_id UUID NOT NULL, -- Will add FK constraint manually
  project_id UUID REFERENCES projects NOT NULL,
  
  -- Revision Info  
  rev_code TEXT NOT NULL, -- '0', '1', '2', 'A', 'B', 'C'
  revision_status TEXT DEFAULT 'PENDING', -- PENDING, SPOOLED, APPLIED, OBSOLETE, DELETED
  
  -- Transmittal/Release Info
  transmittal_code TEXT,
  transmittal_date DATE,
  release_date DATE DEFAULT CURRENT_DATE,
  
  -- Production Data Flags
  has_production_data BOOLEAN DEFAULT false,
  spools_loaded BOOLEAN DEFAULT false,
  welds_loaded BOOLEAN DEFAULT false,
  mto_loaded BOOLEAN DEFAULT false,
  bolted_joints_loaded BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(isometric_id, rev_code)
);

-- Add FK constraint separately to ensure proper column reference
ALTER TABLE engineering_revisions
  ADD CONSTRAINT fk_engineering_revisions_isometric
  FOREIGN KEY (isometric_id) REFERENCES isometrics(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eng_revisions_isometric ON engineering_revisions(isometric_id);
CREATE INDEX IF NOT EXISTS idx_eng_revisions_project ON engineering_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_eng_revisions_status ON engineering_revisions(revision_status);
CREATE INDEX IF NOT EXISTS idx_eng_revisions_code ON engineering_revisions(rev_code);

COMMENT ON TABLE engineering_revisions IS 'Central table for engineering revisions. Each revision is a complete snapshot of isometric data.';

-- =====================================================
-- PART 2: MIGRATE EXISTING DATA TO REVISIONS
-- =====================================================

-- Create one revision for each existing isometric
INSERT INTO engineering_revisions (
  isometric_id,
  project_id,
  rev_code,
  revision_status,
  created_at,
  has_production_data
)
SELECT 
  id as isometric_id,
  project_id,
  COALESCE(revision, 'A') as rev_code, -- Current schema uses 'revision' column
  CASE 
    WHEN status = 'ACTIVE' THEN 'PENDING'
    WHEN status = 'FABRICATION' THEN 'SPOOLED'
    WHEN status = 'INSTALLED' THEN 'APPLIED'
    ELSE 'PENDING'
  END as revision_status,
  created_at,
  false as has_production_data
FROM isometrics
WHERE NOT EXISTS (
  SELECT 1 FROM engineering_revisions er 
  WHERE er.isometric_id = isometrics.id
);

-- =====================================================
-- PART 3: UPDATE ISOMETRICS TABLE
-- =====================================================

-- Add current_revision_id column
ALTER TABLE isometrics 
  ADD COLUMN IF NOT EXISTS current_revision_id UUID REFERENCES engineering_revisions;

-- Update current_revision_id to point to created revisions
UPDATE isometrics i
SET current_revision_id = (
  SELECT id FROM engineering_revisions 
  WHERE isometric_id = i.id 
  ORDER BY created_at DESC 
  LIMIT 1
);

COMMENT ON COLUMN isometrics.current_revision_id IS 'Points to the current/latest revision of this isometric';

-- =====================================================
-- PART 4: REFACTOR SPOOLS TABLE
-- =====================================================

-- Add revision_id column
ALTER TABLE spools
  ADD COLUMN IF NOT EXISTS revision_id UUID REFERENCES engineering_revisions;

-- Migrate existing spools: use iso_number to find isometric, then use current_revision_id
UPDATE spools s
SET revision_id = (
  SELECT er.id
  FROM isometrics i
  INNER JOIN engineering_revisions er ON er.isometric_id = i.id
  WHERE i.iso_number = s.iso_number
    AND er.id = i.current_revision_id
  LIMIT 1
)
WHERE revision_id IS NULL AND iso_number IS NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_spools_revision ON spools(revision_id);

COMMENT ON COLUMN spools.revision_id IS 'Links spool to specific engineering revision';

-- =====================================================
-- PART 5: REFACTOR WELDS TABLE
-- =====================================================

-- Add revision_id column
ALTER TABLE welds
  ADD COLUMN IF NOT EXISTS revision_id UUID REFERENCES engineering_revisions;

-- Migrate existing welds: use spool_number to find spool, then use its revision_id
UPDATE welds w
SET revision_id = (
  SELECT s.revision_id
  FROM spools s
  WHERE s.spool_number = w.spool_number
  LIMIT 1
)
WHERE revision_id IS NULL AND spool_number IS NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_welds_revision ON welds(revision_id);

COMMENT ON COLUMN welds.revision_id IS 'Links weld to specific engineering revision';

-- =====================================================
-- PART 6: CREATE NEW TABLES
-- =====================================================

-- Material Take-Off (MTO)
CREATE TABLE IF NOT EXISTS public.material_take_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES engineering_revisions NOT NULL,
  project_id UUID REFERENCES projects NOT NULL,
  
  -- MTO Data (PIPING columns)
  item_code TEXT NOT NULL,
  qty DECIMAL(10,2) DEFAULT 0,
  qty_unit TEXT,
  piping_class TEXT,
  fab TEXT,
  sheet TEXT,
  line_number TEXT,
  area TEXT,
  spool_full_id TEXT,
  spool_number TEXT,
  revision TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(revision_id, item_code)
);

CREATE INDEX IF NOT EXISTS idx_mto_revision ON material_take_off(revision_id);
CREATE INDEX IF NOT EXISTS idx_mto_project ON material_take_off(project_id);

COMMENT ON TABLE material_take_off IS 'Material Take-Off data linked to specific revisions';

-- Bolted Joints (Flanged Joints)
CREATE TABLE IF NOT EXISTS public.bolted_joints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES engineering_revisions NOT NULL,
  project_id UUID REFERENCES projects NOT NULL,
  
  --Joint Data (PIPING columns)
  flanged_joint_number TEXT NOT NULL,
  piping_class TEXT,
  material TEXT,
  rating TEXT,
  nps TEXT,
  bolt_size TEXT,
  sheet TEXT,
  line_number TEXT,
  iso_number TEXT,
  revision TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(revision_id, flanged_joint_number)
);

CREATE INDEX IF NOT EXISTS idx_bolted_joints_revision ON bolted_joints(revision_id);
CREATE INDEX IF NOT EXISTS idx_bolted_joints_project ON bolted_joints(project_id);

COMMENT ON TABLE bolted_joints IS 'Bolted/flanged joints data linked to specific revisions';

-- Weld Executions (Production Tracking)
CREATE TABLE IF NOT EXISTS public.weld_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weld_id UUID REFERENCES welds NOT NULL,
  project_id UUID REFERENCES projects NOT NULL,
  
  -- Execution Info
  executed_by UUID REFERENCES auth.users,
  cuadrilla_id UUID, -- Future: FK to cuadrillas
  execution_date TIMESTAMPTZ NOT NULL,
  quality_status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, REWORK
  
  -- Migration Tracking (for impact verification)
  migrated_from_revision_id UUID REFERENCES engineering_revisions,
  auto_migrated BOOLEAN DEFAULT false,
  migration_notes TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(weld_id) -- One execution per weld
);

CREATE INDEX IF NOT EXISTS idx_weld_executions_weld ON weld_executions(weld_id);
CREATE INDEX IF NOT EXISTS idx_weld_executions_project ON weld_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_weld_executions_migrated ON weld_executions(migrated_from_revision_id);

COMMENT ON TABLE weld_executions IS 'Tracks production execution of welds with migration history';

-- =====================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE engineering_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_take_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolted_joints ENABLE ROW LEVEL SECURITY;
ALTER TABLE weld_executions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (simpler approach)
DROP POLICY IF EXISTS engineering_revisions_select ON engineering_revisions;
DROP POLICY IF EXISTS engineering_revisions_insert ON engineering_revisions;
DROP POLICY IF EXISTS engineering_revisions_update ON engineering_revisions;
DROP POLICY IF EXISTS engineering_revisions_delete ON engineering_revisions;

DROP POLICY IF EXISTS material_take_off_select ON material_take_off;
DROP POLICY IF EXISTS material_take_off_insert ON material_take_off;

DROP POLICY IF EXISTS bolted_joints_select ON bolted_joints;
DROP POLICY IF EXISTS bolted_joints_insert ON bolted_joints;

DROP POLICY IF EXISTS weld_executions_select ON weld_executions;
DROP POLICY IF EXISTS weld_executions_insert ON weld_executions;
DROP POLICY IF EXISTS weld_executions_update ON weld_executions;

-- Create policies for engineering_revisions
CREATE POLICY engineering_revisions_select ON engineering_revisions
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY engineering_revisions_insert ON engineering_revisions
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY engineering_revisions_update ON engineering_revisions
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY engineering_revisions_delete ON engineering_revisions
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Create policies for material_take_off
CREATE POLICY material_take_off_select ON material_take_off
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY material_take_off_insert ON material_take_off
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Create policies for bolted_joints
CREATE POLICY bolted_joints_select ON bolted_joints
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY bolted_joints_insert ON bolted_joints
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Create policies for weld_executions
CREATE POLICY weld_executions_select ON weld_executions
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY weld_executions_insert ON weld_executions
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY weld_executions_update ON weld_executions
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );


-- =====================================================
-- PART 8: UPDATE PRODUCTION DATA FLAGS
-- =====================================================

-- Update flags for revisions that have data
UPDATE engineering_revisions er
SET spools_loaded = EXISTS(
  SELECT 1 FROM spools WHERE revision_id = er.id
),
welds_loaded = EXISTS(
  SELECT 1 FROM welds WHERE revision_id = er.id
),
has_production_data = EXISTS(
  SELECT 1 FROM spools WHERE revision_id = er.id
) OR EXISTS(
  SELECT 1 FROM welds WHERE revision_id = er.id
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verification queries:
-- SELECT COUNT(*) as isometrics_without_revision FROM isometrics WHERE current_revision_id IS NULL;
-- SELECT COUNT(*) as spools_without_revision FROM spools WHERE revision_id IS NULL;
-- SELECT COUNT(*) as welds_without_revision FROM welds WHERE revision_id IS NULL;
