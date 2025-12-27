/**
 * ISOMETRIC STATUS SYSTEM
 * 
 * Implements 8-state status system with constraints and helper functions
 */

-- Drop old constraint if exists
ALTER TABLE public.isometrics 
  DROP CONSTRAINT IF EXISTS valid_status;

-- Add new status constraint
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

-- Update default status for new isometrics
ALTER TABLE public.isometrics 
  ALTER COLUMN status SET DEFAULT 'VIGENTE';

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_isometrics_status_filter 
  ON public.isometrics(status) 
  WHERE status LIKE 'VIGENTE%';

-- Helper function: Check if isometric has details (is spooleado)
CREATE OR REPLACE FUNCTION public.isometric_has_details(p_isometric_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  detail_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO detail_count
  FROM (
    SELECT id FROM public.spools WHERE isometric_id = p_isometric_id LIMIT 1
    UNION ALL
    SELECT id FROM public.welds WHERE isometric_id = p_isometric_id LIMIT 1
  ) AS details;
  
  RETURN detail_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function: Get count of vigente isometrics pending spooling
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

-- Comments
COMMENT ON CONSTRAINT valid_status ON public.isometrics IS '8-state lifecycle: VIGENTE, VIGENTE_SPOOLEADO, OBSOLETO, OBSOLETO_SPOOLEADO, ELIMINADO, ELIMINADO_SPOOLEADO, EN_EJECUCION, TERMINADA';
COMMENT ON FUNCTION public.isometric_has_details IS 'Returns true if isometric has spools or welds loaded';
COMMENT ON FUNCTION public.count_pending_spooling IS 'Count VIGENTE isometrics waiting for spooling';
