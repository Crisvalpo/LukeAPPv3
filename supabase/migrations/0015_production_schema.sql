/**
 * PHASE 2.5 - PRODUCTION SCHEMA
 * 
 * Real production tables for isometrics, spools, and welds.
 * Replaces mockup tables from migration 0014.
 * Column mappings match PIPING Excel templates exactly.
 */

-- =====================================================
-- 1. CLEAN EXISTING TABLES (Mockup and Real)
-- =====================================================

DROP TABLE IF EXISTS public.isometrics CASCADE;
DROP TABLE IF EXISTS public.spools CASCADE;
DROP TABLE IF EXISTS public.welds CASCADE;

DROP TABLE IF EXISTS public.mockup_isometrics CASCADE;
DROP TABLE IF EXISTS public.mockup_spools CASCADE;
DROP TABLE IF EXISTS public.mockup_welds CASCADE;

-- =====================================================
-- 2. CREATE PRODUCTION TABLES
-- =====================================================

-- ISOMETRICS
CREATE TABLE public.isometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects NOT NULL,
  
  -- Excel columns (exact match)
  iso_number TEXT NOT NULL,
  line_number TEXT,
  rev_id TEXT NOT NULL DEFAULT 'A',
  sheet TEXT,
  area TEXT,
  
  -- System fields
  status TEXT DEFAULT 'ENGINEERING', -- ENGINEERING, FABRICATION, INSTALLED
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(project_id, iso_number, rev_id)
);

-- SPOOLS
CREATE TABLE public.spools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects NOT NULL,
  isometric_id UUID REFERENCES isometrics,
  
  -- Excel columns (exact match)
  spool_number TEXT NOT NULL,
  iso_number TEXT, -- For lookup during import
  line_number TEXT,
  revision TEXT,
  weight DECIMAL(10,2), -- Optional
  diameter TEXT, -- Optional
  
  -- System fields
  fabrication_status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETE
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(project_id, spool_number)
);

-- WELDS
CREATE TABLE public.welds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects NOT NULL,
  spool_id UUID REFERENCES spools,
  
  -- Excel columns (exact match)
  weld_number TEXT NOT NULL,
  spool_number TEXT, -- For lookup during import
  type_weld TEXT, -- Required in validation
  nps TEXT,
  sch TEXT,
  thickness DECIMAL(8,3),
  piping_class TEXT,
  material TEXT,
  destination TEXT,
  sheet TEXT,
  
  -- System fields
  execution_status TEXT DEFAULT 'PENDING', -- PENDING, EXECUTED, QA_APPROVED
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(project_id, weld_number)
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Isometrics
CREATE INDEX idx_isometrics_project ON isometrics(project_id);
CREATE INDEX idx_isometrics_iso_number ON isometrics(iso_number);
CREATE INDEX idx_isometrics_status ON isometrics(status);

-- Spools
CREATE INDEX idx_spools_project ON spools(project_id);
CREATE INDEX idx_spools_isometric ON spools(isometric_id);
CREATE INDEX idx_spools_spool_number ON spools(spool_number);
CREATE INDEX idx_spools_iso_number ON spools(iso_number); -- For import lookup

-- Welds
CREATE INDEX idx_welds_project ON welds(project_id);
CREATE INDEX idx_welds_spool ON welds(spool_id);
CREATE INDEX idx_welds_weld_number ON welds(weld_number);
CREATE INDEX idx_welds_spool_number ON welds(spool_number); -- For import lookup

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE isometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE spools ENABLE ROW LEVEL SECURITY;
ALTER TABLE welds ENABLE ROW LEVEL SECURITY;

-- ISOMETRICS POLICIES
CREATE POLICY isometrics_select ON isometrics
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY isometrics_insert ON isometrics
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY isometrics_update ON isometrics
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY isometrics_delete ON isometrics
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- SPOOLS POLICIES (same pattern)
CREATE POLICY spools_select ON spools
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY spools_insert ON spools
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY spools_update ON spools
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY spools_delete ON spools
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- WELDS POLICIES (same pattern)
CREATE POLICY welds_select ON welds
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY welds_insert ON welds
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY welds_update ON welds
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY welds_delete ON welds
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN members m ON m.company_id = p.company_id
      WHERE m.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE isometrics IS 'Production isometric drawings data. Excel format: ISO NUMBER, LINE NUMBER, REV, SHEET, AREA';
COMMENT ON TABLE spools IS 'Production spool data. Excel format: SPOOL NUMBER, ISO NUMBER, LINE NUMBER, REV, WEIGHT, DIAMETER';
COMMENT ON TABLE welds IS 'Production weld data. Excel format: WELD NUMBER, SPOOL NUMBER, TYPE WELD, NPS, SCH, THICKNESS, PIPING CLASS, MATERIAL, DESTINATION, SHEET';
