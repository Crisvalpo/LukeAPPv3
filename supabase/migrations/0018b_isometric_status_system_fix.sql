-- ISOMETRIC STATUS SYSTEM (Refactored for 0016+ Schema)
-- Replaces old isometrics.status logic with engineering_revisions.revision_status lookups

-- NOTE: The 'status' column on 'isometrics' was dropped in 0016.
-- We do not re-add it. Instead, we use helper functions to look up the status via the current_revision_id.

-- Step 6: Helper function - Check if isometric has details (is spooleado)
CREATE OR REPLACE FUNCTION public.isometric_has_details(p_isometric_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_rev_id UUID;
  spool_count INTEGER;
  weld_count INTEGER;
BEGIN
  -- Get current revision ID
  SELECT current_revision_id INTO current_rev_id
  FROM isometrics
  WHERE id = p_isometric_id;
  
  IF current_rev_id IS NULL THEN
      RETURN FALSE;
  END IF;

  -- Check for spools
  SELECT COUNT(*) INTO spool_count
  FROM public.spools 
  WHERE revision_id = current_rev_id 
  LIMIT 1;
  
  -- Check for welds
  SELECT COUNT(*) INTO weld_count
  FROM public.welds 
  WHERE revision_id = current_rev_id 
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
    FROM public.engineering_revisions er
    WHERE er.project_id = p_project_id
      AND er.revision_status = 'PENDING' -- Map VIGENTE -> PENDING (or use actual status)
      -- NOTE: Schema uses: PENDING, SPOOLED, APPLIED, OBSOLETE, DELETED
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 8: Helper function - Count vigente isometrics
CREATE OR REPLACE FUNCTION public.count_vigente_isometrics(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.engineering_revisions er
    WHERE er.project_id = p_project_id
      AND er.revision_status IN ('PENDING', 'SPOOLED', 'APPLIED')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 9: Helper function - Count obsolete isometrics
CREATE OR REPLACE FUNCTION public.count_obsolete_isometrics(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.engineering_revisions er
    WHERE er.project_id = p_project_id
      AND er.revision_status = 'OBSOLETE'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 10: Helper function - Count eliminated isometrics
CREATE OR REPLACE FUNCTION public.count_eliminado_isometrics(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.engineering_revisions er
    WHERE er.project_id = p_project_id
      AND er.revision_status = 'DELETED'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Comments
COMMENT ON FUNCTION public.isometric_has_details IS 'Returns true if current revision has spools or welds loaded';
COMMENT ON FUNCTION public.count_pending_spooling IS 'Count PENDING revisions';
COMMENT ON FUNCTION public.count_vigente_isometrics IS 'Count active revisions (PENDING, SPOOLED, APPLIED)';
COMMENT ON FUNCTION public.count_obsolete_isometrics IS 'Count OBSOLETE revisions';
COMMENT ON FUNCTION public.count_eliminado_isometrics IS 'Count DELETED revisions';

SELECT 'Migration 0018b (Refactored) completed successfully!' as message;
