-- Add Spatial Metadata to BIM Models
-- Purpose: Store position, rotation, and scale for 3D alignment
-- Source: GLB files exported from Navisworks contain embedded spatial coordinates

-- ============================================
-- 1. Add spatial metadata to structure_models
-- ============================================
ALTER TABLE public.structure_models 
  ADD COLUMN IF NOT EXISTS position_x REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_z REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation_x REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation_y REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation_z REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scale_x REAL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scale_y REAL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scale_z REAL DEFAULT 1;

-- Add metadata field for storing GLB bounding box info
ALTER TABLE public.structure_models 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.structure_models.position_x IS 'World X coordinate (meters) - extracted from GLB';
COMMENT ON COLUMN public.structure_models.position_y IS 'World Y coordinate (meters) - extracted from GLB';
COMMENT ON COLUMN public.structure_models.position_z IS 'World Z coordinate (meters) - extracted from GLB';
COMMENT ON COLUMN public.structure_models.rotation_x IS 'Rotation around X axis (radians)';
COMMENT ON COLUMN public.structure_models.rotation_y IS 'Rotation around Y axis (radians)';
COMMENT ON COLUMN public.structure_models.rotation_z IS 'Rotation around Z axis (radians)';
COMMENT ON COLUMN public.structure_models.scale_x IS 'Scale factor X axis';
COMMENT ON COLUMN public.structure_models.scale_y IS 'Scale factor Y axis';
COMMENT ON COLUMN public.structure_models.scale_z IS 'Scale factor Z axis';
COMMENT ON COLUMN public.structure_models.metadata IS 'Additional GLB metadata (bounding box, etc)';

-- ============================================
-- 2. Add spatial metadata to isometrics
-- ============================================
ALTER TABLE public.isometrics 
  ADD COLUMN IF NOT EXISTS model_url TEXT,
  ADD COLUMN IF NOT EXISTS position_x REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_z REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation_x REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation_y REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation_z REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scale_x REAL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scale_y REAL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scale_z REAL DEFAULT 1;

-- Add metadata field for storing GLB bounding box info
ALTER TABLE public.isometrics 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.isometrics.model_url IS 'URL to GLB model file in Supabase Storage';
COMMENT ON COLUMN public.isometrics.position_x IS 'World X coordinate (meters) - extracted from GLB';
COMMENT ON COLUMN public.isometrics.position_y IS 'World Y coordinate (meters) - extracted from GLB';
COMMENT ON COLUMN public.isometrics.position_z IS 'World Z coordinate (meters) - extracted from GLB';
COMMENT ON COLUMN public.isometrics.rotation_x IS 'Rotation around X axis (radians)';
COMMENT ON COLUMN public.isometrics.rotation_y IS 'Rotation around Y axis (radians)';
COMMENT ON COLUMN public.isometrics.rotation_z IS 'Rotation around Z axis (radians)';
COMMENT ON COLUMN public.isometrics.scale_x IS 'Scale factor X axis';
COMMENT ON COLUMN public.isometrics.scale_y IS 'Scale factor Y axis';
COMMENT ON COLUMN public.isometrics.scale_z IS 'Scale factor Z axis';
COMMENT ON COLUMN public.isometrics.metadata IS 'Additional GLB metadata (bounding box, etc)';

-- ============================================
-- 3. Create indices for spatial queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_structure_models_spatial 
  ON public.structure_models(position_x, position_y, position_z);

CREATE INDEX IF NOT EXISTS idx_isometrics_spatial 
  ON public.isometrics(position_x, position_y, position_z);

-- ============================================
-- 4. Verification Query
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Spatial metadata columns added successfully';
  RAISE NOTICE 'structure_models columns: %', (
    SELECT string_agg(column_name, ', ')
    FROM information_schema.columns
    WHERE table_name = 'structure_models'
      AND column_name LIKE '%position%' OR column_name LIKE '%rotation%' OR column_name LIKE '%scale%'
  );
  RAISE NOTICE 'isometrics columns: %', (
    SELECT string_agg(column_name, ', ')
    FROM information_schema.columns
    WHERE table_name = 'isometrics'
      AND column_name LIKE '%position%' OR column_name LIKE '%rotation%' OR column_name LIKE '%scale%'
  );
END $$;
