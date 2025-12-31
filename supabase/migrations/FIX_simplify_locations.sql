-- Migration: Simplify Default Project Locations
-- Description: Updates the auto-seeding function to remove "Installed" and consolidate Workshops.
--              Also cleans up existing locations to match the new standard.

-- 1. Update the Constraint to remove 'installed' as a valid type?
-- Actually, removing it from CHECK constraint might break existing rows if we don't clean them first. 
-- We will keep 'installed' in the CHECK constraint for historical safety or remove it if strictly required. 
-- For now, let's update the constraint to be cleaner IF we can ensure data consistency.
-- Ideally: ALTER TABLE project_locations DROP CONSTRAINT valid_location_type; ... ADD CONSTRAINT ...

-- 2. Replace the Seed Function
CREATE OR REPLACE FUNCTION seed_default_project_locations()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert 4 basic locations (Cleaner setup)
  INSERT INTO project_locations (project_id, company_id, name, code, type, description)
  VALUES
    (NEW.id, NEW.company_id, 'Bodega Principal', 'BDP', 'storage', 'Bodega principal de almacenamiento'),
    (NEW.id, NEW.company_id, 'Maestranza Principal', 'MST', 'workshop', 'Taller central de fabricación'),
    (NEW.id, NEW.company_id, 'Terreno', 'TER', 'field', 'Área de montaje en sitio'),
    (NEW.id, NEW.company_id, 'En Tránsito', 'TRAN', 'transit', 'Spools en transporte');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Cleanup Existing Data (HARD DELETE per user request)
-- Safely delete 'Installed' locations. Spools will have current_location_id set to NULL automatically.
DELETE FROM project_locations 
WHERE type = 'installed';

-- Rename 'Taller Prefabricación' to 'Maestranza Principal' if it exists.
UPDATE project_locations
SET name = 'Maestranza Principal', code = 'MST', description = 'Taller central de fabricación'
WHERE name = 'Taller Prefabricación' AND type = 'workshop';

-- Delete redundant workshops ('Taller Soldadura', 'Pintura').
DELETE FROM project_locations
WHERE name IN ('Taller Soldadura', 'Pintura') AND type = 'workshop';

