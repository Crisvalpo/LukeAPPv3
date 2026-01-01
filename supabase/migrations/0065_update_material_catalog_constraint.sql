-- Migration 0065: Update Material Catalog Unique Constraint
-- Allows duplicate ident_codes within a project IF they have different spec_codes

-- 1. Drop the old strict constraint
ALTER TABLE material_catalog 
DROP CONSTRAINT IF EXISTS unique_ident_per_project;

-- 2. Add new unique index that includes spec_code
-- We use COALESCE to ensure that specific NULL spec rows are treated as distinct from others, 
-- but we only allow ONE row with (project_id, ident, NULL/Empty).
-- This prevents duplicates even for items without a spec.
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_catalog_unique_key 
ON material_catalog (project_id, ident_code, COALESCE(spec_code, ''));
