-- Fix RLS for material_receipts and related tables
-- Previous policies relied on auth.jwt() ->> 'company_id' which might be unreliable
-- Switching to explicit checks against public.members

-- 1. MATERIAL RECEIPTS
DROP POLICY IF EXISTS "material_receipts_company_isolation" ON material_receipts;

CREATE POLICY "material_receipts_select" ON material_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_receipts.project_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "material_receipts_insert" ON material_receipts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_receipts.project_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "material_receipts_update" ON material_receipts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_receipts.project_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "material_receipts_delete" ON material_receipts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
      WHERE p.id = material_receipts.project_id
      AND m.user_id = auth.uid()
    )
  );

-- 2. MATERIAL RECEIPT ITEMS
-- Inherit access from receipt
DROP POLICY IF EXISTS "material_receipt_items_company_isolation" ON material_receipt_items;

CREATE POLICY "material_receipt_items_access" ON material_receipt_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM material_receipts mr
      WHERE mr.id = material_receipt_items.receipt_id
      -- Recursively checks receipt access via its own RLS or similar logic?
      -- Postgres policies are not recursive by default if infinite recursion risk, but checks against other tables use their RLS if enabled?
      -- To be safe and performant, we verify project access directly again.
      AND EXISTS (
        SELECT 1 FROM projects p
        JOIN members m ON m.project_id = p.id OR m.company_id = p.company_id
        WHERE p.id = mr.project_id
        AND m.user_id = auth.uid()
      )
    )
  );

-- Force cache reload
NOTIFY pgrst, 'reload config';
