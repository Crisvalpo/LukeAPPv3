-- ============================================================================
-- SINCRONIZACIÓN DE RLS: CAPA DE MATERIALES Y LOGÍSTICA
-- ============================================================================
-- Tablas: material_catalog, material_instances, material_inventory, 
--         material_receipts, material_receipt_items, material_requests, 
--         material_request_items, material_take_off.
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de materiales con Cloud.

-- ----------------------------------------------------------------------------
-- 1. Tabla: material_catalog
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "material_catalog_company_isolation" ON public.material_catalog;
CREATE POLICY "material_catalog_company_isolation" ON public.material_catalog
FOR ALL USING (
  company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: material_instances
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "material_instances_access" ON public.material_instances;
CREATE POLICY "material_instances_access" ON public.material_instances
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN members m ON (m.project_id = p.id OR m.company_id = p.company_id)
    WHERE p.id = material_instances.project_id AND m.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- 3. Tabla: material_inventory
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "material_inventory_access_policy" ON public.material_inventory;
CREATE POLICY "material_inventory_access_policy" ON public.material_inventory
FOR ALL USING (
  project_id IN (SELECT project_id FROM members WHERE user_id = auth.uid() AND project_id IS NOT NULL)
  OR 
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- 4. Tabla: material_receipts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "material_receipts_access_policy" ON public.material_receipts;
CREATE POLICY "material_receipts_access_policy" ON public.material_receipts
FOR ALL USING (
  project_id IN (SELECT project_id FROM members WHERE user_id = auth.uid() AND project_id IS NOT NULL)
  OR 
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- 5. Tabla: material_receipt_items
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "material_receipt_items_access" ON public.material_receipt_items;
CREATE POLICY "material_receipt_items_access" ON public.material_receipt_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM material_receipts mr
    WHERE mr.id = material_receipt_items.receipt_id 
      AND EXISTS (
        SELECT 1 FROM projects p
        JOIN members m ON (m.project_id = p.id OR m.company_id = p.company_id)
        WHERE p.id = mr.project_id AND m.user_id = auth.uid()
      )
  )
);

-- ----------------------------------------------------------------------------
-- 6. Tabla: material_requests
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "material_requests_project_access" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_access" ON public.material_requests;
DROP POLICY IF EXISTS "Users can delete requests" ON public.material_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.material_requests;
DROP POLICY IF EXISTS "Users can view requests" ON public.material_requests;
DROP POLICY IF EXISTS "Users can update requests" ON public.material_requests;

-- Política de acceso por proyecto (Cloud redundante pero fiel)
CREATE POLICY "material_requests_project_access" ON public.material_requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN members m ON (m.project_id = p.id OR m.company_id = p.company_id)
    WHERE p.id = material_requests.project_id AND m.user_id = auth.uid()
  )
);

-- Políticas genéricas basadas en autenticación (Matching Cloud)
CREATE POLICY "Users can create requests" ON public.material_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view requests" ON public.material_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update requests" ON public.material_requests FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete requests" ON public.material_requests FOR DELETE USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 7. Tabla: material_request_items
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "material_request_items_delete_policy" ON public.material_request_items;
DROP POLICY IF EXISTS "material_request_items_insert_policy" ON public.material_request_items;
DROP POLICY IF EXISTS "material_request_items_select_policy" ON public.material_request_items;
DROP POLICY IF EXISTS "material_request_items_update_policy" ON public.material_request_items;

CREATE POLICY "material_request_items_select_policy" ON public.material_request_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "material_request_items_insert_policy" ON public.material_request_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "material_request_items_update_policy" ON public.material_request_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "material_request_items_delete_policy" ON public.material_request_items FOR DELETE USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 8. Tabla: material_take_off (MTO)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage MTO" ON public.material_take_off;
DROP POLICY IF EXISTS "material_take_off_insert" ON public.material_take_off;
DROP POLICY IF EXISTS "Users can view MTO" ON public.material_take_off;
DROP POLICY IF EXISTS "material_take_off_select" ON public.material_take_off;

CREATE POLICY "Users can manage MTO" ON public.material_take_off FOR ALL USING (
  company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid())
);

CREATE POLICY "material_take_off_insert" ON public.material_take_off FOR INSERT WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "material_take_off_select" ON public.material_take_off FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);
