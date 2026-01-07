-- Add missing foreign keys to material_request_items
-- This enables PostgREST to detect relationships for joins

ALTER TABLE material_request_items
ADD CONSTRAINT fk_material_request_items_spool
FOREIGN KEY (spool_id)
REFERENCES spools(id)
ON DELETE SET NULL;

ALTER TABLE material_request_items
ADD CONSTRAINT fk_material_request_items_isometric
FOREIGN KEY (isometric_id)
REFERENCES isometrics(id)
ON DELETE SET NULL;

-- Ensure indexes exist for these foreign keys (good practice)
CREATE INDEX IF NOT EXISTS idx_material_request_items_spool_id ON material_request_items(spool_id);
CREATE INDEX IF NOT EXISTS idx_material_request_items_isometric_id ON material_request_items(isometric_id);

-- Force schema cache reload (usually automatic, but explicit notify can help)
NOTIFY pgrst, 'reload config';
