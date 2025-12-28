-- Migration: Add MTO table and align Spools/Welds/Joints schema
-- Description: Creates material_take_off table and ensures all detail tables have revision_id + company_id

-- 1. Create MTO table if not exists
CREATE TABLE IF NOT EXISTS public.material_take_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    revision_id UUID REFERENCES engineering_revisions(id), -- Link to specific revision
    iso_id UUID REFERENCES isometrics(id), -- Link to isometric (optional but good for query)
    
    item_code TEXT NOT NULL,
    description TEXT,
    qty DECIMAL(10, 3) NOT NULL DEFAULT 0,
    qty_unit TEXT,
    piping_class TEXT,
    fab VARCHAR(50), -- SHOP / FIELD
    sheet VARCHAR(50),
    line_number TEXT,
    area TEXT,
    spool_full_id TEXT,
    spool_number TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Uniqueness per revision? Or per project? 
    -- Usually MTO is unique by ITEM_CODE within a SPOOL or ISO+REV
    CONSTRAINT uq_mto_item_rev UNIQUE (revision_id, item_code, spool_number)
);

-- 1b. Ensure MTO has columns if it already existed (Fix for existing table)
ALTER TABLE public.material_take_off
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
    ADD COLUMN IF NOT EXISTS revision_id UUID REFERENCES engineering_revisions(id),
    ADD COLUMN IF NOT EXISTS iso_id UUID REFERENCES isometrics(id);

-- 2. Ensure SPOOLS has revision_id + company_id
ALTER TABLE public.spools 
    ADD COLUMN IF NOT EXISTS revision_id UUID REFERENCES engineering_revisions(id),
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

ALTER TABLE public.spools 
    ALTER COLUMN company_id SET NOT NULL; -- careful if existing data

-- 3. Ensure WELDS has revision_id + company_id
ALTER TABLE public.welds 
    ADD COLUMN IF NOT EXISTS revision_id UUID REFERENCES engineering_revisions(id),
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

ALTER TABLE public.welds 
    ALTER COLUMN company_id SET NOT NULL;

-- 4. Enable RLS for MTO
ALTER TABLE public.material_take_off ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors
DROP POLICY IF EXISTS "Users can view MTO" ON public.material_take_off;
DROP POLICY IF EXISTS "Users can manage MTO" ON public.material_take_off;

CREATE POLICY "Users can view MTO" ON public.material_take_off
    FOR SELECT USING (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage MTO" ON public.material_take_off
    FOR ALL USING (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_mto_revision ON public.material_take_off(revision_id);
CREATE INDEX IF NOT EXISTS idx_spools_revision ON public.spools(revision_id);
CREATE INDEX IF NOT EXISTS idx_welds_revision ON public.welds(revision_id);
