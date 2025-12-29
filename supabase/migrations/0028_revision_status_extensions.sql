-- Migration 0028: Revision Status Extensions
-- FASE 2A - Sprint 1
-- Adds data_status and material_status to revisions
-- Adds spool classification (PIPE_STICK vs FABRICATED)

-- =============================================
-- 1. ADD STATUS COLUMNS TO REVISIONS
-- =============================================

ALTER TABLE engineering_revisions
  ADD COLUMN IF NOT EXISTS data_status TEXT NOT NULL DEFAULT 'VACIO'
    CHECK (data_status IN ('VACIO', 'EN_DESARROLLO', 'COMPLETO', 'BLOQUEADO')),
  ADD COLUMN IF NOT EXISTS material_status TEXT NOT NULL DEFAULT 'NO_REQUERIDO'
    CHECK (material_status IN ('NO_REQUERIDO', 'PENDIENTE_COMPRA', 'PENDIENTE_APROBACION', 'EN_TRANSITO', 'DISPONIBLE', 'ASIGNADO'));

-- =============================================
-- 2. ADD CLASSIFICATION TO SPOOLS (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools') THEN
    ALTER TABLE spools
      ADD COLUMN IF NOT EXISTS spool_type TEXT DEFAULT 'SIMPLE'
        CHECK (spool_type IN ('PIPE_STICK', 'SIMPLE', 'COMPLEX')),
      ADD COLUMN IF NOT EXISTS shop_welds_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS field_welds_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- 3. ADD weld_location TO WELDS (if table exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_welds') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'spools_welds' AND column_name = 'weld_location'
    ) THEN
      ALTER TABLE spools_welds
        ADD COLUMN weld_location TEXT DEFAULT 'SHOP'
          CHECK (weld_location IN ('SHOP', 'FIELD'));
    END IF;
  END IF;
END $$;

-- =============================================
-- 4. TRIGGER: Auto-classify Spools (if table exists)
-- =============================================

CREATE OR REPLACE FUNCTION classify_spool()
RETURNS TRIGGER AS $$
BEGIN
  -- Count shop welds
  SELECT COUNT(*) INTO NEW.shop_welds_count
  FROM spools_welds
  WHERE spool_id = NEW.id
    AND weld_location = 'SHOP';
  
  -- Count field welds  
  SELECT COUNT(*) INTO NEW.field_welds_count
  FROM spools_welds
  WHERE spool_id = NEW.id
    AND weld_location = 'FIELD';
  
  -- Classify based on shop welds
  IF NEW.shop_welds_count = 0 THEN
    NEW.spool_type = 'PIPE_STICK';
  ELSIF NEW.shop_welds_count <= 3 THEN
    NEW.spool_type = 'SIMPLE';
  ELSE
    NEW.spool_type = 'COMPLEX';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools') THEN
    DROP TRIGGER IF EXISTS auto_classify_spool ON spools;
    CREATE TRIGGER auto_classify_spool
      BEFORE INSERT OR UPDATE ON spools
      FOR EACH ROW
      EXECUTE FUNCTION classify_spool();
  END IF;
END $$;

-- =============================================
-- 5. TRIGGER: Update Spool Classification on Weld Changes
-- =============================================

CREATE OR REPLACE FUNCTION update_spool_classification_on_weld_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger a re-classification of the spool
  UPDATE spools SET updated_at = NOW() WHERE id = COALESCE(NEW.spool_id, OLD.spool_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_welds') THEN
    DROP TRIGGER IF EXISTS update_spool_on_weld_change ON spools_welds;
    CREATE TRIGGER update_spool_on_weld_change
      AFTER INSERT OR UPDATE OR DELETE ON spools_welds
      FOR EACH ROW
      EXECUTE FUNCTION update_spool_classification_on_weld_change();
  END IF;
END $$;

-- =============================================
-- 6. FUNCTION: Calculate Data Status
-- =============================================

CREATE OR REPLACE FUNCTION calculate_data_status(revision_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  has_welds BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Check if spools_welds table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_welds'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RETURN 'VACIO';
  END IF;
  
  -- Check if has welds data
  SELECT EXISTS (
    SELECT 1 FROM spools_welds WHERE revision_id = revision_id_param
  ) INTO has_welds;
  
  -- Determine status
  IF has_welds THEN
    RETURN 'COMPLETO';
  ELSE
    RETURN 'VACIO';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. FUNCTION: Calculate Material Status
-- =============================================

CREATE OR REPLACE FUNCTION calculate_material_status(revision_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  has_requests BOOLEAN;
  all_completed BOOLEAN;
  any_approved BOOLEAN;
  any_submitted BOOLEAN;
BEGIN
  -- Check if there are material requests for this revision
  SELECT EXISTS (
    SELECT 1 
    FROM material_requests mr
    JOIN engineering_revisions er ON er.project_id = mr.project_id
    WHERE er.id = revision_id_param
  ) INTO has_requests;
  
  IF NOT has_requests THEN
    RETURN 'NO_REQUERIDO';
  END IF;
  
  -- Check request statuses
  SELECT 
    BOOL_AND(status = 'COMPLETED'),
    BOOL_OR(status IN ('APPROVED', 'PARTIAL')),
    BOOL_OR(status = 'SUBMITTED')
  INTO all_completed, any_approved, any_submitted
  FROM material_requests mr
  JOIN engineering_revisions er ON er.project_id = mr.project_id
  WHERE er.id = revision_id_param;
  
  -- Determine status
  IF all_completed THEN
    RETURN 'DISPONIBLE';
  ELSIF any_approved THEN
    RETURN 'EN_TRANSITO';
  ELSIF any_submitted THEN
    RETURN 'PENDIENTE_APROBACION';
  ELSE
    RETURN 'PENDIENTE_COMPRA';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. FUNCTION: Check if Revision is Fabricable
-- =============================================

CREATE OR REPLACE FUNCTION is_fabricable(revision_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rev RECORD;
BEGIN
  SELECT 
    revision_status,
    data_status,
    material_status
  INTO rev
  FROM engineering_revisions
  WHERE id = revision_id_param;
  
  RETURN (
    rev.revision_status = 'VIGENTE' AND
    rev.data_status = 'COMPLETO' AND
    rev.material_status = 'DISPONIBLE'
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. CREATE INDEX for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_revisions_data_status ON engineering_revisions(data_status);
CREATE INDEX IF NOT EXISTS idx_revisions_material_status ON engineering_revisions(material_status);
CREATE INDEX IF NOT EXISTS idx_revisions_fabricable ON engineering_revisions(revision_status, data_status, material_status) 
  WHERE revision_status = 'VIGENTE';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools') THEN
    CREATE INDEX IF NOT EXISTS idx_spools_type ON spools(spool_type);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_welds') THEN
    CREATE INDEX IF NOT EXISTS idx_spools_welds_location ON spools_welds(weld_location);
  END IF;
END $$;

-- =============================================
-- 10. UPDATE EXISTING DATA (One-time, conditional)
-- =============================================

-- Recalculate data_status for existing revisions
UPDATE engineering_revisions
SET data_status = calculate_data_status(id)
WHERE data_status = 'VACIO';

-- Trigger spool classification for existing spools (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools') THEN
    UPDATE spools SET updated_at = NOW();
  END IF;
END $$;

-- Set default weld_location for existing welds (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_welds') THEN
    UPDATE spools_welds 
    SET weld_location = 'SHOP' 
    WHERE weld_location IS NULL;
  END IF;
END $$;
