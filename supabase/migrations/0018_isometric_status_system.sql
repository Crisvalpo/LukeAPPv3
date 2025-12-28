/**
 * ISOMETRIC STATUS SYSTEM (FIX)
 * 
 * Updates existing data before applying constraints
 */

-- Step 1: Update existing invalid statuses to valid ones
UPDATE public.isometrics
SET status = 'VIGENTE'
WHERE status NOT IN (
  'VIGENTE',
  'VIGENTE_SPOOLEADO',
  'OBSOLETO',
  'OBSOLETO_SPOOLEADO',
  'ELIMINADO',
  'ELIMINADO_SPOOLEADO',
  'EN_EJECUCION',
  'TERMINADA'
) OR status IS NULL;

-- Step 2: Drop old constraint if exists
ALTER TABLE public.isometrics 
  DROP CONSTRAINT IF EXISTS valid_status;

-- Step 3: Add new status constraint
ALTER TABLE public.isometrics
  ADD CONSTRAINT valid_status CHECK (
    status IN (
      'VIGENTE',
      'VIGENTE_SPOOLEADO',
      'OBSOLETO',
      'OBSOLETO_SPOOLEADO',
      'ELIMINADO',
      'ELIMINADO_SPOOLEADO',
      'EN_EJECUCION',
      'TERMINADA'
    )
  );

-- Step 4: Update default status for new isometrics
ALTER TABLE public.isometrics 
  ALTER COLUMN status SET DEFAULT 'VIGENTE';

-- Step 5: Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_isometrics_status_filter 
  ON public.isometrics(status) 
  WHERE status LIKE 'VIGENTE%';

-- Step 6: Helper function - Check if isometric has details (is spooleado)
CREATE OR REPLACE FUNCTION public.isometric_has_details(p_isometric_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  spool_count INTEGER;
  weld_count INTEGER;
BEGIN
  -- Check for spools
  SELECT COUNT(*) INTO spool_count
  FROM public.spools 
  WHERE isometric_id = p_isometric_id 
  LIMIT 1;
  
  -- Check for welds
  SELECT COUNT(*) INTO weld_count
  FROM public.welds 
  WHERE isometric_id = p_isometric_id 
  LIMIT 1;
  
  RETURN (spool_count > 0 OR weld_count > 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 7: Helper function - Get count of vigente isometrics pending spooling
CREATE OR REPLACE FUNCTION public.count_pending_spooling(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.isometrics
    WHERE project_id = p_project_id
      AND status = 'VIGENTE'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 8: Helper function - Count vigente isometrics (includes EN_EJECUCION and TERMINADA)
CREATE OR REPLACE FUNCTION public.count_vigente_isometrics(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.isometrics
    WHERE project_id = p_project_id
      AND (
        status LIKE 'VIGENTE%' 
        OR status = 'EN_EJECUCION' 
        OR status = 'TERMINADA'
      )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 9: Helper function - Count obsolete isometrics
CREATE OR REPLACE FUNCTION public.count_obsolete_isometrics(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.isometrics
    WHERE project_id = p_project_id
      AND status LIKE 'OBSOLETO%'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 10: Helper function - Count eliminated isometrics
CREATE OR REPLACE FUNCTION public.count_eliminado_isometrics(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.isometrics
    WHERE project_id = p_project_id
      AND status LIKE 'ELIMINADO%'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 11: Comments
COMMENT ON CONSTRAINT valid_status ON public.isometrics IS '8-state lifecycle: VIGENTE, VIGENTE_SPOOLEADO, OBSOLETO, OBSOLETO_SPOOLEADO, ELIMINADO, ELIMINADO_SPOOLEADO, EN_EJECUCION, TERMINADA';
COMMENT ON FUNCTION public.isometric_has_details IS 'Returns true if isometric has spools or welds loaded';
COMMENT ON FUNCTION public.count_pending_spooling IS 'Count VIGENTE isometrics waiting for spooling';
COMMENT ON FUNCTION public.count_vigente_isometrics IS 'Count active isometrics (VIGENTE%, EN_EJECUCION, TERMINADA)';
COMMENT ON FUNCTION public.count_obsolete_isometrics IS 'Count obsolete/superseded isometrics';
COMMENT ON FUNCTION public.count_eliminado_isometrics IS 'Count deleted/cancelled isometrics';

-- Step 12: Verify migration success
SELECT 
  'Migration 0018 completed successfully!' as message,
  COUNT(*) as total_isometrics,
  COUNT(*) FILTER (WHERE status LIKE 'VIGENTE%') as vigente_count,
  COUNT(*) FILTER (WHERE status LIKE 'OBSOLETO%') as obsoleto_count,
  COUNT(*) FILTER (WHERE status LIKE 'ELIMINADO%') as eliminado_count
FROM public.isometrics;
