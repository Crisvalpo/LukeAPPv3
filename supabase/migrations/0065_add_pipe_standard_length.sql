-- Migration 0065: Add Standard Pipe Length to Material Catalog
-- Allows engineers to know the standard stick/bundle length for planning spools

-- =============================================
-- 1. ADD COLUMN FOR STANDARD LENGTH
-- =============================================

-- Add stick_standard_length to material_catalog
-- This represents the standard length that pipes/sticks come in from suppliers
-- For example: DN50 pipes might come in 6-meter sticks, DN100 in 12-meter sticks

ALTER TABLE material_catalog
ADD COLUMN IF NOT EXISTS stick_standard_length DECIMAL(10,3);

-- =============================================
-- 2. ADD HELPFUL COMMENT
-- =============================================

COMMENT ON COLUMN material_catalog.stick_standard_length IS 
'Standard length (in meters) that this material comes in from suppliers. Used for pipe planning and optimization. NULL for non-pipe materials.';

-- =============================================
-- 3. UPDATE EXISTING PIPE MATERIALS (OPTIONAL)
-- =============================================

-- You can set default standard lengths for existing pipes if needed
-- Common standards:
-- - Small bore (DN15-DN50): 6 meters
-- - Medium bore (DN80-DN150): 12 meters  
-- - Large bore (DN200+): 12 meters

-- Example (uncomment and adjust as needed):
-- UPDATE material_catalog
-- SET stick_standard_length = 6.0
-- WHERE part_group = 'MET Pipes and Tubes'
--   AND ident_code LIKE '%DN15%' OR ident_code LIKE '%DN25%' OR ident_code LIKE '%DN50%';

-- UPDATE material_catalog
-- SET stick_standard_length = 12.0
-- WHERE part_group = 'MET Pipes and Tubes'
--   AND stick_standard_length IS NULL;
