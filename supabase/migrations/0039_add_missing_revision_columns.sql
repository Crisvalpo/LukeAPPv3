-- Add missing columns to engineering_revisions for full compatibility
-- These columns are used by the Revisions UI

-- Add transmittal (TML number)
ALTER TABLE engineering_revisions
  ADD COLUMN IF NOT EXISTS transmittal TEXT;

-- Add announcement_date (when revision was announced/published)
ALTER TABLE engineering_revisions
  ADD COLUMN IF NOT EXISTS announcement_date TIMESTAMPTZ;

-- Verification
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'engineering_revisions'
  AND column_name IN ('transmittal', 'announcement_date', 'company_id', 'data_status', 'material_status')
ORDER BY column_name;
