-- ===================================================================
-- MIGRATION 0066: Project Week Configuration
-- Adds project start date and week-end day configuration
-- Enables week-based planning and material tracking
-- ===================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. ADD COLUMNS TO PROJECTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS week_end_day INTEGER DEFAULT 6;  -- 0=Sunday, 6=Saturday

COMMENT ON COLUMN projects.start_date IS 'Official project start date for week calculation';
COMMENT ON COLUMN projects.week_end_day IS 'Day of week considered as week-end (0=Sunday, 6=Saturday)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. FUNCTION: Calculate Project Week Number
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION calculate_project_week(
  p_project_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
  v_start_date DATE;
  v_days_elapsed INTEGER;
BEGIN
  -- Get project start date
  SELECT start_date INTO v_start_date
  FROM projects
  WHERE id = p_project_id;
  
  -- If no start date configured, return NULL
  IF v_start_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate days elapsed
  v_days_elapsed = p_date - v_start_date;
  
  -- If negative (date before project start), return NULL
  IF v_days_elapsed < 0 THEN
    RETURN NULL;
  END IF;
  
  -- Week 1 = days 0-6, Week 2 = days 7-13, etc.
  RETURN FLOOR(v_days_elapsed / 7) + 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_project_week IS 'Calculates the project week number based on start_date';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. FUNCTION: Get Start Date of a Specific Week
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION get_week_start_date(
  p_project_id UUID,
  p_week_number INTEGER
) RETURNS DATE AS $$
DECLARE
  v_start_date DATE;
BEGIN
  SELECT start_date INTO v_start_date
  FROM projects
  WHERE id = p_project_id;
  
  IF v_start_date IS NULL OR p_week_number < 1 THEN
    RETURN NULL;
  END IF;
  
  -- Week N starts at (N-1) * 7 days from project start
  RETURN v_start_date + ((p_week_number - 1) * 7);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_week_start_date IS 'Returns the start date of a specific project week';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. FUNCTION: Get End Date of a Specific Week
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION get_week_end_date(
  p_project_id UUID,
  p_week_number INTEGER
) RETURNS DATE AS $$
BEGIN
  RETURN get_week_start_date(p_project_id, p_week_number) + 6;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_week_end_date IS 'Returns the end date of a specific project week';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. HELPER VIEW: Current Project Week Info
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE VIEW view_projects_week_info AS
SELECT 
  p.id,
  p.name,
  p.code,
  p.start_date,
  p.week_end_day,
  calculate_project_week(p.id, CURRENT_DATE) as current_week,
  CASE 
    WHEN p.start_date IS NOT NULL 
    THEN CURRENT_DATE - p.start_date
    ELSE NULL
  END as project_day,
  CASE p.week_end_day
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as week_end_day_name
FROM projects p;

COMMENT ON VIEW view_projects_week_info IS 'Helper view showing current week information for all projects';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. GRANT PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Allow authenticated users to execute the functions
GRANT EXECUTE ON FUNCTION calculate_project_week TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_start_date TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_end_date TO authenticated;

-- Allow authenticated users to select from the view
GRANT SELECT ON view_projects_week_info TO authenticated;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SUCCESS MESSAGE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT '✅ Migration 0066: Project Week Configuration - Completed Successfully' as status;
