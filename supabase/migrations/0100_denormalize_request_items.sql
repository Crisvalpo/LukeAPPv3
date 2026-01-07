-- Denormalize company_id to material_request_items to simplify RLS
-- This fixes the "new row violates row-level security policy" error during insertion due to complex subquery visibility

-- 1. Add column
ALTER TABLE material_request_items 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 2. Populate existing data
UPDATE material_request_items mri
SET company_id = mr.company_id
FROM material_requests mr
WHERE mri.request_id = mr.id
AND mri.company_id IS NULL;

-- 3. Update RLS Policy
DROP POLICY IF EXISTS "material_request_items_company_isolation" ON material_request_items;

CREATE POLICY "material_request_items_company_isolation" ON material_request_items
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- 4. Ensure index
CREATE INDEX IF NOT EXISTS idx_material_request_items_company ON material_request_items(company_id);
