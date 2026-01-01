-- =============================================
-- Migration 0062: Auto-Registration System for Weld Types
-- =============================================

-- Purpose:
-- Replace dynamic discovery with one-time auto-registration via trigger.
-- When welds are imported from Excel, types are automatically registered.
-- This eliminates expensive DISTINCT queries on large datasets.

-- =============================================
-- 1. REMOVE OLD CONSTRAINT & ADD UNIQUE
-- =============================================

-- Remove old "exceptions only" constraint (from migration 0061)
-- We now store ALL types, not just exceptions
ALTER TABLE project_weld_type_config 
DROP CONSTRAINT IF EXISTS chk_only_exceptions;

-- Ensure (project_id, type_code) is unique
ALTER TABLE project_weld_type_config 
DROP CONSTRAINT IF EXISTS uq_project_weld_type;

ALTER TABLE project_weld_type_config 
ADD CONSTRAINT uq_project_weld_type 
UNIQUE (project_id, type_code);

COMMENT ON CONSTRAINT uq_project_weld_type ON project_weld_type_config IS
'Ensures each type_code appears only once per project';

-- =============================================
-- 2. AUTO-REGISTRATION TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION auto_register_weld_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if type_weld has a value
    IF NEW.type_weld IS NOT NULL AND TRIM(NEW.type_weld) != '' THEN
        -- Insert new type if it doesn't exist
        -- ON CONFLICT does nothing if already registered
        INSERT INTO project_weld_type_config (
            project_id,
            company_id,
            type_code,
            type_name_es,
            type_name_en,
            requires_welder,
            icon,
            color
        )
        VALUES (
            NEW.project_id,
            NEW.company_id,
            NEW.type_weld,
            NEW.type_weld, -- Use code as default name
            NULL,
            true, -- DEFAULT: All types require welder unless marked otherwise
            '🔗', -- Default icon
            '#6b7280' -- Default gray color
        )
        ON CONFLICT (project_id, type_code) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_register_weld_type() IS
'Automatically registers new weld types when welds are imported from Excel.
Runs once per new type, avoiding expensive DISTINCT queries on large datasets.';

-- =============================================
-- 3. CREATE TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS trg_auto_register_weld_types ON spools_welds;

CREATE TRIGGER trg_auto_register_weld_types
    AFTER INSERT ON spools_welds
    FOR EACH ROW
    EXECUTE FUNCTION auto_register_weld_type();

COMMENT ON TRIGGER trg_auto_register_weld_types ON spools_welds IS
'Auto-registers weld types when new welds are inserted (e.g., from Excel import).
This makes the config page instant even with 100k+ welds.';

-- =============================================
-- 4. BACKFILL: Register existing types
-- =============================================

-- Register all existing types from current data
INSERT INTO project_weld_type_config (
    project_id,
    company_id,
    type_code,
    type_name_es,
    requires_welder,
    icon,
    color
)
SELECT DISTINCT
    sw.project_id,
    sw.company_id,
    sw.type_weld as type_code,
    sw.type_weld as type_name_es,
    true as requires_welder, -- Default
    '🔗' as icon,
    '#6b7280' as color
FROM spools_welds sw
WHERE sw.type_weld IS NOT NULL 
  AND TRIM(sw.type_weld) != ''
ON CONFLICT (project_id, type_code) DO NOTHING;

-- =============================================
-- 5. VERIFICATION
-- =============================================

-- Show registered types per project
SELECT 
    p.name as project_name,
    wtc.type_code,
    wtc.type_name_es,
    wtc.requires_welder,
    COUNT(sw.id) as total_welds
FROM project_weld_type_config wtc
JOIN projects p ON wtc.project_id = p.id
LEFT JOIN spools_welds sw ON sw.project_id = wtc.project_id AND sw.type_weld = wtc.type_code
GROUP BY p.name, wtc.type_code, wtc.type_name_es, wtc.requires_welder
ORDER BY p.name, wtc.type_code;

-- Summary
SELECT 
    'Migration 0062 complete' as status,
    'Weld types will now auto-register on Excel import' as message,
    COUNT(DISTINCT project_id) as projects_with_types,
    COUNT(*) as total_types_registered
FROM project_weld_type_config;
