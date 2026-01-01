-- Migration 0064: Fix Material Catalog Permissions
-- Fix "permission denied" error by granting explicit table privileges

-- 1. Grant Access to Roles
GRANT ALL ON TABLE material_catalog TO service_role;
GRANT ALL ON TABLE material_catalog TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE material_catalog TO authenticated;

-- 2. Ensure RLS is enabled (just in case)
ALTER TABLE material_catalog ENABLE ROW LEVEL SECURITY;

-- 3. Verify Policy
-- (We recreate it to be sure it exists and uses the right logic)
DROP POLICY IF EXISTS "material_catalog_company_isolation" ON material_catalog;

CREATE POLICY "material_catalog_company_isolation" ON material_catalog
  FOR ALL 
  USING (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    )
  );

-- 4. Grant Sequence usage if any (id is uuid, so no sequence usually, but good practice)
-- (No serial sequence for uuid primary key)
