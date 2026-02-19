-- Fix: Add missing columns to isometrics table for announcement uploads
-- The announcement service expects these columns but they weren't created in initial setup

ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS line_number TEXT;
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS line_type TEXT;
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS sub_area TEXT;
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS file_revision TEXT;
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS sheet TEXT;
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'VIGENTE';
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS revision TEXT;

-- Verify all columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'isometrics' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
