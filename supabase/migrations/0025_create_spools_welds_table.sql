-- Migration 0025: Restructure for Welds-First Pattern (PIPING-REF architecture)
-- Description: Replaces separate spools/welds tables with unified spools_welds table

-- =====================================================
-- 1. Drop old separate tables (if they exist)
-- =====================================================

DROP TABLE IF EXISTS public.welds CASCADE;
DROP TABLE IF EXISTS public.spools CASCADE;

-- =====================================================
-- 2. Create spools_welds table (Welds with Spool info)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.spools_welds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_id UUID NOT NULL REFERENCES engineering_revisions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Identifiers from Excel
    iso_number TEXT NOT NULL,
    rev TEXT NOT NULL,
    line_number TEXT,
    spool_number TEXT NOT NULL,
    sheet TEXT,
    weld_number TEXT NOT NULL,
    
    -- Weld Properties
    destination TEXT, -- SHOP / FIELD
    type_weld TEXT, -- BW / SW / TW / etc
    nps TEXT, -- Nominal Pipe Size
    sch TEXT, -- Schedule
    thickness TEXT,
    piping_class TEXT,
    material TEXT,
    
    -- Meta
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT uq_weld_per_revision UNIQUE (revision_id, weld_number)
);

-- =====================================================
-- 3. Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_spools_welds_revision ON public.spools_welds(revision_id);
CREATE INDEX IF NOT EXISTS idx_spools_welds_company ON public.spools_welds(company_id);
CREATE INDEX IF NOT EXISTS idx_spools_welds_spool ON public.spools_welds(spool_number);
CREATE INDEX IF NOT EXISTS idx_spools_welds_project ON public.spools_welds(project_id);

-- =====================================================
-- 4. Enable RLS
-- =====================================================

ALTER TABLE public.spools_welds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view spools_welds" ON public.spools_welds;
DROP POLICY IF EXISTS "Users can manage spools_welds" ON public.spools_welds;

-- Create RLS policies
CREATE POLICY "Users can view spools_welds"
    ON public.spools_welds
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage spools_welds"
    ON public.spools_welds
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM public.members WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 5. Verification
-- =====================================================

SELECT 'Migration 0025 complete: spools_welds table ready' as status;
