-- Migration 0037: Pipe Inventory & Dispatch System
-- Enables tracking of individual pipe sticks, bulk workshop deliveries, and cutting orders.

-- =============================================
-- 1. ENUMS & TYPES
-- =============================================

CREATE TYPE pipe_location AS ENUM ('WAREHOUSE', 'IN_TRANSIT', 'WORKSHOP', 'SCRAP', 'INSTALLED');
CREATE TYPE delivery_status AS ENUM ('DRAFT', 'PLANNED', 'SENT', 'RECEIVED', 'CANCELLED');
CREATE TYPE cutting_status AS ENUM ('PENDING', 'CUT', 'LABELED');

-- =============================================
-- 1.5. WORKSHOPS TABLE (Dependency)
-- =============================================

CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for workshops
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workshops" ON workshops
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage workshops" ON workshops
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid() 
      AND role_id IN ('admin', 'founder', 'supervisor')
    )
  );

-- =============================================
-- 2. WORKSHOP DELIVERIES (Bulk Dispatch)
-- =============================================

CREATE TABLE IF NOT EXISTS workshop_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  workshop_id UUID NOT NULL REFERENCES workshops(id), -- Assuming workshops table exists, otherwise might need text or new table
  
  delivery_number TEXT NOT NULL, -- e.g., "DEL-001"
  status delivery_status DEFAULT 'DRAFT',
  planned_date DATE,
  received_date TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 3. PIPE STICKS (Physical Inventory)
-- =============================================

CREATE TABLE IF NOT EXISTS pipe_sticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Material Identity (Links to Catalog)
  ident_code TEXT NOT NULL, 
  material_spec TEXT, -- Denormalized for query perfs
  
  -- Dimensions & Properties
  initial_length DECIMAL(10,3) NOT NULL, -- In Meters
  current_length DECIMAL(10,3) NOT NULL, -- In Meters
  heat_number TEXT,
  
  -- Tracking
  location pipe_location DEFAULT 'WAREHOUSE',
  
  -- References
  delivery_id UUID REFERENCES workshop_deliveries(id), -- If allocated/shipped
  current_workshop_id UUID REFERENCES workshops(id), -- If located at workshop
  parent_stick_id UUID REFERENCES pipe_sticks(id), -- If cut from another stick
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. PIPE CUTTING ORDERS (Execution)
-- =============================================

CREATE TABLE IF NOT EXISTS pipe_cutting_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Demand Source
  spool_id UUID NOT NULL REFERENCES spools(id),
  
  -- Allocation
  stick_id UUID REFERENCES pipe_sticks(id), -- The stick to cut FROM
  
  -- Requirements
  required_length DECIMAL(10,3) NOT NULL,
  
  -- Status
  status cutting_status DEFAULT 'PENDING',
  cut_date TIMESTAMPTZ,
  cut_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. INDEXES
-- =============================================

CREATE INDEX idx_workshop_deliveries_project ON workshop_deliveries(project_id);
CREATE INDEX idx_pipe_sticks_project ON pipe_sticks(project_id);
CREATE INDEX idx_pipe_sticks_ident ON pipe_sticks(ident_code);
CREATE INDEX idx_pipe_sticks_location ON pipe_sticks(location);
CREATE INDEX idx_cutting_orders_spool ON pipe_cutting_orders(spool_id);

-- =============================================
-- 6. RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE workshop_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipe_sticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipe_cutting_orders ENABLE ROW LEVEL SECURITY;

-- Standard Project Access Policies (Assuming members table check logic matches others)
-- For brevity using the existing patterns:

CREATE POLICY "Users can view workshop_deliveries" ON workshop_deliveries
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage workshop_deliveries" ON workshop_deliveries
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid() 
      AND role_id IN ('admin', 'founder', 'supervisor')
    )
  );

CREATE POLICY "Users can view pipe_sticks" ON pipe_sticks
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage pipe_sticks" ON pipe_sticks
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'founder', 'supervisor')
    )
  );

CREATE POLICY "Users can view cutting_orders" ON pipe_cutting_orders
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage cutting_orders" ON pipe_cutting_orders
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'founder', 'supervisor')
    )
  );

-- =============================================
-- 6.5. WORKSHOPS RLS (Fix)
-- =============================================
-- (Already added in previous step, ensuring consistency)

-- =============================================
-- 7. TRIGGERS
-- =============================================

CREATE TRIGGER set_workshop_deliveries_timestamp
  BEFORE UPDATE ON workshop_deliveries FOR EACH ROW EXECUTE FUNCTION update_material_catalog_timestamp(); -- Reusing existing function

CREATE TRIGGER set_pipe_sticks_timestamp
  BEFORE UPDATE ON pipe_sticks FOR EACH ROW EXECUTE FUNCTION update_material_catalog_timestamp();

CREATE TRIGGER set_cutting_orders_timestamp
  BEFORE UPDATE ON pipe_cutting_orders FOR EACH ROW EXECUTE FUNCTION update_material_catalog_timestamp();
