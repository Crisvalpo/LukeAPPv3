-- Migration: Create inventory and commitment system
-- Description: Tracks material reception and automated allocation to spools
-- Author: LukeAPP v3
-- Date: 2026-02-15

-- 1. Inventory Receptions (Physical Stock)
CREATE TABLE IF NOT EXISTS inventory_receptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    master_id uuid NOT NULL REFERENCES master_catalog(id),
    dimension_id uuid NOT NULL REFERENCES master_dimensions(id),
    
    quantity_received numeric NOT NULL CHECK (quantity_received > 0),
    quantity_available numeric NOT NULL CHECK (quantity_available >= 0),
    
    unit text NOT NULL DEFAULT 'UNIT',
    location_bin text, -- Storage location
    heat_number text, -- Traceability
    certificate_number text,
    
    received_at timestamptz DEFAULT now(),
    received_by uuid REFERENCES auth.users(id),
    notes text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Material Commitments (Soft Allocation)
CREATE TABLE IF NOT EXISTS material_commitments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    spool_id uuid NOT NULL REFERENCES spools(id) ON DELETE CASCADE,
    inventory_id uuid NOT NULL REFERENCES inventory_receptions(id) ON DELETE CASCADE,
    
    quantity_committed numeric NOT NULL CHECK (quantity_committed > 0),
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure we don't commit the same inventory to the same spool multiple times
    UNIQUE(spool_id, inventory_id)
);

-- 3. Modify Spools Table
ALTER TABLE spools 
ADD COLUMN IF NOT EXISTS material_readiness text DEFAULT 'PENDING' 
CHECK (material_readiness IN ('PENDING', 'PARTIAL', 'READY'));

-- Indices
CREATE INDEX IF NOT EXISTS idx_inv_rec_project ON inventory_receptions(project_id);
CREATE INDEX IF NOT EXISTS idx_inv_rec_master ON inventory_receptions(master_id);
CREATE INDEX IF NOT EXISTS idx_mat_com_spool ON material_commitments(spool_id);
CREATE INDEX IF NOT EXISTS idx_mat_com_inv ON material_commitments(inventory_id);

-- 4. RLS Policies
ALTER TABLE inventory_receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory of their projects"
ON inventory_receptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.project_id = inventory_receptions.project_id
        AND members.user_id = auth.uid()
    )
);

CREATE POLICY "Procurement can manage inventory"
ON inventory_receptions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.project_id = inventory_receptions.project_id
        AND members.user_id = auth.uid()
        AND (members.role_id IN ('admin', 'founder', 'super_admin', 'procurement'))
    )
);

CREATE POLICY "Users can view commitments of their projects"
ON material_commitments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.project_id = material_commitments.project_id
        AND members.user_id = auth.uid()
    )
);
