/**
 * MIGRATION 0016a - PIPING Schema Compatibility
 * 
 * Adds missing columns required by PIPING Excel templates.
 * This is a NON-DESTRUCTIVE migration - preserves all existing data.
 * 
 * Execute BEFORE 0016b (engineering_revisions refactor)
 */

-- =====================================================
-- PART 1: ISOMETRICS - Add PIPING columns
-- =====================================================

ALTER TABLE isometrics
  ADD COLUMN IF NOT EXISTS line_number TEXT,
  ADD COLUMN IF NOT EXISTS sheet TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_isometrics_line_number ON isometrics(line_number);
CREATE INDEX IF NOT EXISTS idx_isometrics_area ON isometrics(area);

COMMENT ON COLUMN isometrics.line_number IS 'Line number from PIPING Excel template';
COMMENT ON COLUMN isometrics.sheet IS 'Sheet number from PIPING Excel template';
COMMENT ON COLUMN isometrics.area IS 'Area from PIPING Excel template';

-- =====================================================
-- PART 2: SPOOLS - Add PIPING columns
-- =====================================================

ALTER TABLE spools
  ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS diameter TEXT,
  ADD COLUMN IF NOT EXISTS line_number TEXT,
  ADD COLUMN IF NOT EXISTS iso_number TEXT; -- For Excel lookup

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_spools_iso_number ON spools(iso_number);
CREATE INDEX IF NOT EXISTS idx_spools_line_number ON spools(line_number);

COMMENT ON COLUMN spools.weight IS 'Spool weight from PIPING Excel template';
COMMENT ON COLUMN spools.diameter IS 'Spool diameter from PIPING Excel template';
COMMENT ON COLUMN spools.line_number IS 'Line number from PIPING Excel template';
COMMENT ON COLUMN spools.iso_number IS 'ISO number for direct lookup during Excel import';

-- =====================================================
-- PART 3: WELDS - Add PIPING columns
-- =====================================================

ALTER TABLE welds
  ADD COLUMN IF NOT EXISTS nps TEXT,
  ADD COLUMN IF NOT EXISTS sch TEXT,
  ADD COLUMN IF NOT EXISTS thickness DECIMAL(8,3),
  ADD COLUMN IF NOT EXISTS piping_class TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS sheet TEXT,
  ADD COLUMN IF NOT EXISTS spool_number TEXT; -- For Excel lookup

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_welds_spool_number ON welds(spool_number);
CREATE INDEX IF NOT EXISTS idx_welds_nps ON welds(nps);
CREATE INDEX IF NOT EXISTS idx_welds_piping_class ON welds(piping_class);

COMMENT ON COLUMN welds.nps IS 'Nominal Pipe Size from PIPING Excel template';
COMMENT ON COLUMN welds.sch IS 'Schedule (wall thickness standard) from PIPING Excel template';
COMMENT ON COLUMN welds.thickness IS 'Actual wall thickness from PIPING Excel template';
COMMENT ON COLUMN welds.piping_class IS 'Piping class from PIPING Excel template';
COMMENT ON COLUMN welds.material IS 'Material from PIPING Excel template';
COMMENT ON COLUMN welds.destination IS 'Destination (SHOP/FIELD) from PIPING Excel template';
COMMENT ON COLUMN welds.sheet IS 'Sheet number from PIPING Excel template';
COMMENT ON COLUMN welds.spool_number IS 'Spool number for direct lookup during Excel import';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify columns were added:

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'isometrics' 
-- AND column_name IN ('line_number', 'sheet', 'area');

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'spools' 
-- AND column_name IN ('weight', 'diameter', 'line_number', 'iso_number');

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'welds' 
-- AND column_name IN ('nps', 'sch', 'thickness', 'piping_class', 'material', 'destination', 'sheet', 'spool_number');
