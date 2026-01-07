-- Migration: AppSheet Integration for Weld Execution Tracking
-- Adds fields for workers to mark welds as executed in the field

-- 1. ADD EXECUTION TRACKING COLUMNS
ALTER TABLE spools_welds
  ADD COLUMN IF NOT EXISTS execution_status TEXT DEFAULT 'PENDING'
    CHECK (execution_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS executed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS welder_id UUID REFERENCES members(id),
  ADD COLUMN IF NOT EXISTS welder_stamp TEXT,
  ADD COLUMN IF NOT EXISTS execution_notes TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_spools_welds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spools_welds_updated_at
BEFORE UPDATE ON spools_welds
FOR EACH ROW
EXECUTE FUNCTION update_spools_welds_updated_at();

-- 2. ADD PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_welds_execution_status 
  ON spools_welds(execution_status) 
  WHERE execution_status != 'COMPLETED';

CREATE INDEX IF NOT EXISTS idx_welds_by_welder 
  ON spools_welds(welder_id) 
  WHERE welder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_welds_by_project_status
  ON spools_welds(project_id, execution_status);

-- 3. CREATE SIMPLIFIED VIEW FOR APPSHEET
-- Note: spools_welds uses spool_number + revision_id to join with spools table
-- Note: members table doesn't have email, we get it from auth.users via user_id
CREATE OR REPLACE VIEW appsheet_welds_execution AS
SELECT 
  -- Primary IDs
  w.id,
  w.project_id,
  
  -- Weld Identification
  w.weld_number,
  w.spool_number,
  w.iso_number,
  w.line_number,
  
  -- Technical Details
  w.type_weld,
  w.destination,
  w.nps,
  w.sch,
  w.material,
  w.piping_class,
  
  -- Execution Status
  w.execution_status,
  w.executed_at,
  w.execution_notes,
  w.photo_url,
  
  -- Welder Info
  w.welder_stamp,
  welder_auth.email as welder_name,
  
  -- Context (for display)
  s.spool_number as spool_tag,
  r.rev_code,
  i.iso_number as isometric_full,
  
  -- Audit
  w.created_at,
  w.updated_at,
  executor_auth.email as executed_by_name
  
FROM spools_welds w
LEFT JOIN spools s ON s.spool_number = w.spool_number AND s.revision_id = w.revision_id
LEFT JOIN engineering_revisions r ON r.id = w.revision_id
LEFT JOIN isometrics i ON i.id = r.isometric_id
LEFT JOIN members welder ON welder.id = w.welder_id
LEFT JOIN auth.users welder_auth ON welder_auth.id = welder.user_id
LEFT JOIN auth.users executor_auth ON executor_auth.id = w.executed_by
WHERE r.revision_status = 'VIGENTE'
ORDER BY w.spool_number, w.weld_number;

-- 4. GRANT PERMISSIONS FOR APPSHEET ACCESS
-- Note: Grants for both authenticated users and service_role (for AppSheet connection)
GRANT SELECT ON appsheet_welds_execution TO authenticated;
GRANT SELECT ON appsheet_welds_execution TO service_role;
GRANT SELECT ON appsheet_welds_execution TO anon;

GRANT UPDATE (execution_status, executed_at, executed_by, welder_id, welder_stamp, execution_notes, photo_url, updated_at) 
  ON spools_welds TO authenticated;
GRANT UPDATE (execution_status, executed_at, executed_by, welder_id, welder_stamp, execution_notes, photo_url, updated_at) 
  ON spools_welds TO service_role;

-- 5. MAKE VIEW EDITABLE: INSTEAD OF UPDATE TRIGGER
-- This allows AppSheet to UPDATE the view directly (it will update the underlying table)
CREATE OR REPLACE FUNCTION update_appsheet_welds_execution()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the underlying spools_welds table
  UPDATE spools_welds
  SET 
    execution_status = NEW.execution_status,
    executed_at = NEW.executed_at,
    executed_by = NEW.executed_by,
    welder_id = NEW.welder_id,
    welder_stamp = NEW.welder_stamp,
    execution_notes = NEW.execution_notes,
    photo_url = NEW.photo_url
    -- updated_at is handled by the table's own trigger
  WHERE id = OLD.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_appsheet_welds_execution
INSTEAD OF UPDATE ON appsheet_welds_execution
FOR EACH ROW
EXECUTE FUNCTION update_appsheet_welds_execution();

-- 5. CREATE HELPER FUNCTION FOR BULK STATUS UPDATE
CREATE OR REPLACE FUNCTION mark_weld_executed(
  weld_id UUID,
  welder_member_id UUID,
  stamp TEXT,
  notes TEXT DEFAULT NULL,
  photo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE spools_welds
  SET 
    execution_status = 'COMPLETED',
    executed_at = NOW(),
    executed_by = auth.uid(),
    welder_id = welder_member_id,
    welder_stamp = stamp,
    execution_notes = notes,
    photo_url = photo,
    updated_at = NOW()
  WHERE id = weld_id
    AND execution_status = 'PENDING';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. VERIFICATION QUERY
SELECT 
  'Total Welds' as metric,
  COUNT(*) as count
FROM spools_welds
UNION ALL
SELECT 
  'Pending' as metric,
  COUNT(*) as count
FROM spools_welds
WHERE execution_status = 'PENDING'
UNION ALL
SELECT 
  'Completed' as metric,
  COUNT(*) as count
FROM spools_welds
WHERE execution_status = 'COMPLETED';
