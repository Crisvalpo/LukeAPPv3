-- Migration 0027: Material Control Foundation
-- FASE 2A - Sprint 1
-- Creates core entities for Material Requests (MIR/PO), Inventory, and QR Tracking

-- =============================================
-- 1. MATERIAL REQUESTS (MIR + Purchase Orders)
-- =============================================

CREATE TABLE IF NOT EXISTS material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  request_number TEXT UNIQUE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('CLIENT_MIR', 'CONTRACTOR_PO')),
  status TEXT NOT NULL DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIAL', 'REJECTED', 'COMPLETED')),
  requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eta_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. MATERIAL REQUEST ITEMS (Line Items)
-- =============================================

CREATE TABLE IF NOT EXISTS material_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
  material_spec TEXT NOT NULL,
  quantity_requested DECIMAL(10,2) NOT NULL CHECK (quantity_requested > 0),
  quantity_approved DECIMAL(10,2) CHECK (quantity_approved >= 0),
  quantity_received DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  spool_id UUID,
  isometric_id UUID,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. MATERIAL RECEIPTS (Physical Deliveries)
-- =============================================

CREATE TABLE IF NOT EXISTS material_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES material_requests(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  receipt_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_note TEXT,
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES material_receipts(id) ON DELETE CASCADE,
  request_item_id UUID NOT NULL REFERENCES material_request_items(id),
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  batch_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. MATERIAL INVENTORY (Bulk Stock)
-- =============================================

CREATE TABLE IF NOT EXISTS material_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  material_spec TEXT NOT NULL,
  quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_allocated DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity_allocated >= 0),
  location TEXT,
  source_request_id UUID REFERENCES material_requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, material_spec, location)
);

-- =============================================
-- 5. MATERIAL INSTANCES (QR Tracking - Unique Items)
-- =============================================

CREATE TABLE IF NOT EXISTS material_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  qr_code TEXT UNIQUE NOT NULL,
  material_spec TEXT NOT NULL,
  source_batch_id TEXT,
  spool_id UUID,
  request_item_id UUID REFERENCES material_request_items(id),
  status TEXT NOT NULL DEFAULT 'ISSUED' 
    CHECK (status IN ('ISSUED', 'CUT', 'INSTALLED', 'SCRAP')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: material_requests
CREATE POLICY "material_requests_company_isolation" ON material_requests
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- RLS Policy: material_request_items (inherit from parent)
CREATE POLICY "material_request_items_company_isolation" ON material_request_items
  FOR ALL USING (
    request_id IN (
      SELECT id FROM material_requests 
      WHERE company_id = (auth.jwt() ->> 'company_id')::uuid
    )
  );

-- RLS Policy: material_receipts
CREATE POLICY "material_receipts_company_isolation" ON material_receipts
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id = (auth.jwt() ->> 'company_id')::uuid
    )
  );

-- RLS Policy: material_receipt_items (inherit from parent)
CREATE POLICY "material_receipt_items_company_isolation" ON material_receipt_items
  FOR ALL USING (
    receipt_id IN (
      SELECT mr.id FROM material_receipts mr
      JOIN projects p ON p.id = mr.project_id
      WHERE p.company_id = (auth.jwt() ->> 'company_id')::uuid
    )
  );

-- RLS Policy: material_inventory
CREATE POLICY "material_inventory_company_isolation" ON material_inventory
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- RLS Policy: material_instances
CREATE POLICY "material_instances_company_isolation" ON material_instances
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =============================================
-- 7. INDEXES for Performance
-- =============================================

CREATE INDEX idx_material_requests_project ON material_requests(project_id);
CREATE INDEX idx_material_requests_status ON material_requests(status);
CREATE INDEX idx_material_request_items_request ON material_request_items(request_id);
CREATE INDEX idx_material_request_items_spool ON material_request_items(spool_id);
CREATE INDEX idx_material_inventory_project_spec ON material_inventory(project_id, material_spec);
CREATE INDEX idx_material_instances_spool ON material_instances(spool_id);
CREATE INDEX idx_material_instances_qr ON material_instances(qr_code);

-- =============================================
-- 8. TRIGGERS: Auto-generate Request Number
-- =============================================

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  prefix TEXT;
BEGIN
  -- Determine prefix based on request type
  IF NEW.request_type = 'CLIENT_MIR' THEN
    prefix := 'MIR';
  ELSE
    prefix := 'PO';
  END IF;
  
  -- Get next number for this project
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM '\d+$') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM material_requests
  WHERE project_id = NEW.project_id
    AND request_number LIKE prefix || '-%';
  
  -- Generate request number
  NEW.request_number := prefix || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_number
  BEFORE INSERT ON material_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_request_number();

-- =============================================
-- 9. TRIGGERS: Update Inventory on Receipt
-- =============================================

CREATE OR REPLACE FUNCTION update_inventory_on_receipt()
RETURNS TRIGGER AS $$
DECLARE
  req_item RECORD;
BEGIN
  -- Get request item details
  SELECT 
    mri.material_spec,
    mr.project_id,
    mr.company_id
  INTO req_item
  FROM material_request_items mri
  JOIN material_requests mr ON mr.id = mri.request_id
  WHERE mri.id = NEW.request_item_id;
  
  -- Update or insert into inventory
  INSERT INTO material_inventory (
    project_id,
    company_id,
    material_spec,
    quantity_available,
    location,
    source_request_id
  )
  VALUES (
    req_item.project_id,
    req_item.company_id,
    req_item.material_spec,
    NEW.quantity,
    'BODEGA',
    (SELECT request_id FROM material_request_items WHERE id = NEW.request_item_id)
  )
  ON CONFLICT (project_id, material_spec, location)
  DO UPDATE SET
    quantity_available = material_inventory.quantity_available + NEW.quantity;
  
  -- Update quantity_received in request item
  UPDATE material_request_items
  SET quantity_received = quantity_received + NEW.quantity
  WHERE id = NEW.request_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_after_receipt
  AFTER INSERT ON material_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_receipt();

-- =============================================
-- 10. TRIGGERS: Update Request Status
-- =============================================

CREATE OR REPLACE FUNCTION update_request_status()
RETURNS TRIGGER AS $$
DECLARE
  req_id UUID;
  total_items INTEGER;
  fully_received INTEGER;
  partially_received INTEGER;
BEGIN
  -- Get request_id
  SELECT request_id INTO req_id
  FROM material_request_items
  WHERE id = NEW.request_item_id;
  
  -- Count items
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE quantity_received >= COALESCE(quantity_approved, quantity_requested)) as fully,
    COUNT(*) FILTER (WHERE quantity_received > 0 AND quantity_received < COALESCE(quantity_approved, quantity_requested)) as partial
  INTO total_items, fully_received, partially_received
  FROM material_request_items
  WHERE request_id = req_id;
  
  -- Update request status
  IF fully_received = total_items THEN
    UPDATE material_requests SET status = 'COMPLETED' WHERE id = req_id;
  ELSIF partially_received > 0 OR fully_received > 0 THEN
    UPDATE material_requests SET status = 'PARTIAL' WHERE id = req_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_request_status_after_receipt
  AFTER INSERT ON material_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION update_request_status();
