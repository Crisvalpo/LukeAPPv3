-- Fix RLS for Inventory, Requests, and Instances
-- Replacing legacy (auth.jwt() ->> 'company_id') checks with public.members lookups

-- 1. MATERIAL INVENTORY
DROP POLICY IF EXISTS "material_inventory_company_isolation" ON material_inventory;

CREATE POLICY "material_inventory_select" ON material_inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_inventory.project_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "material_inventory_modify" ON material_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_inventory.project_id
      AND m.user_id = auth.uid()
    )
  );

-- 2. MATERIAL REQUESTS
DROP POLICY IF EXISTS "material_requests_company_isolation" ON material_requests;

CREATE POLICY "material_requests_access" ON material_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_requests.project_id
      AND m.user_id = auth.uid()
    )
  );

-- 3. MATERIAL REQUEST ITEMS
DROP POLICY IF EXISTS "material_request_items_company_isolation" ON material_request_items;

CREATE POLICY "material_request_items_access" ON material_request_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM material_requests mr
      WHERE mr.id = material_request_items.request_id
      AND EXISTS (
        SELECT 1 FROM projects p
        JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
        WHERE p.id = mr.project_id
        AND m.user_id = auth.uid()
      )
    )
  );

-- 4. MATERIAL INSTANCES
DROP POLICY IF EXISTS "material_instances_company_isolation" ON material_instances;

CREATE POLICY "material_instances_access" ON material_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_instances.project_id
      AND m.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload config';
