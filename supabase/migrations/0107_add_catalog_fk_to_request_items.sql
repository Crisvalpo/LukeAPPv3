-- Add catalog_id FK to material_request_items for rich descriptions

-- 1. Add nullable column first
ALTER TABLE material_request_items
ADD COLUMN IF NOT EXISTS catalog_id UUID;

-- 2. Add foreign key constraint
ALTER TABLE material_request_items
ADD CONSTRAINT fk_material_request_items_catalog
FOREIGN KEY (catalog_id) REFERENCES material_catalog(id)
ON DELETE SET NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_material_request_items_catalog_id 
ON material_request_items(catalog_id);

-- 4. Try to populate catalog_id by matching material_spec to ident_code
UPDATE material_request_items mri
SET catalog_id = mc.id
FROM material_catalog mc
WHERE mri.catalog_id IS NULL
  AND mri.material_spec = mc.ident_code;

-- 5. Add comment
COMMENT ON COLUMN material_request_items.catalog_id IS 
'Optional FK to material_catalog for rich descriptions. Links material_spec to catalog entry.';

-- Verification query
SELECT 
    COUNT(*) FILTER (WHERE catalog_id IS NOT NULL) as with_catalog,
    COUNT(*) FILTER (WHERE catalog_id IS NULL) as without_catalog
FROM material_request_items;
