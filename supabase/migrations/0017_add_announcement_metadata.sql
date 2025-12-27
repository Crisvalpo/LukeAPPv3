/**
 * ADD ANNOUNCEMENT METADATA COLUMNS
 * 
 * Adds columns for transmittal, dates, and other metadata from announcement Excel
 */

-- Add metadata columns to isometrics table
ALTER TABLE public.isometrics 
  ADD COLUMN IF NOT EXISTS line_type TEXT,
  ADD COLUMN IF NOT EXISTS sub_area TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_revision TEXT;

-- Add metadata columns to engineering_revisions table  
ALTER TABLE public.engineering_revisions
  ADD COLUMN IF NOT EXISTS transmittal TEXT,
  ADD COLUMN IF NOT EXISTS announcement_date DATE;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_isometrics_area ON isometrics(area);
CREATE INDEX IF NOT EXISTS idx_isometrics_sub_area ON isometrics(sub_area);
CREATE INDEX IF NOT EXISTS idx_eng_rev_transmittal ON engineering_revisions(transmittal);
CREATE INDEX IF NOT EXISTS idx_eng_rev_date ON engineering_revisions(announcement_date);

-- Add comments
COMMENT ON COLUMN isometrics.line_type IS 'Line size classification: LB (Larger Size/línea mayor), SB (Small Size/línea menor)';
COMMENT ON COLUMN isometrics.sub_area IS 'Sub-area classification from announcement';
COMMENT ON COLUMN isometrics.file_name IS 'Drawing file name from announcement';
COMMENT ON COLUMN isometrics.file_revision IS 'Drawing file revision from announcement';
COMMENT ON COLUMN engineering_revisions.transmittal IS 'Transmittal number (TML) for this revision';
COMMENT ON COLUMN engineering_revisions.announcement_date IS 'Date when revision was announced';
