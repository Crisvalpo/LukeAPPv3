-- Migration 0031: Fix Spools Trigger & Restore Spools Table
-- 1. Fixes the "relation spools does not exist" error by dropping broken triggers
-- 2. Restores the 'spools' table which is needed for MTO and Tracking
-- 3. Adds logic to auto-create spools from welds (Welds-First Pattern)

-- =====================================================
-- 1. DROP BROKEN OBJECTS
-- =====================================================

DROP TRIGGER IF EXISTS update_spool_on_weld_change ON public.spools_welds;
DROP FUNCTION IF EXISTS update_spool_classification_on_weld_change();

-- =====================================================
-- 2. RE-CREATE SPOOLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.spools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_id UUID NOT NULL REFERENCES engineering_revisions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Identity
    spool_number TEXT NOT NULL,
    
    -- Status Tracking
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_FABRICATION', 'COMPLETED', 'PAINTING', 'SHIPPED', 'DELIVERED', 'INSTALLED')),
    
    -- Properties derived from welds
    total_welds INTEGER DEFAULT 0,
    shop_welds INTEGER DEFAULT 0,
    field_welds INTEGER DEFAULT 0,
    total_inches DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_spool_per_revision UNIQUE (revision_id, spool_number)
);

-- =====================================================
-- 3. ENABLE RLS FOR SPOOLS
-- =====================================================

ALTER TABLE public.spools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view spools" ON public.spools;
CREATE POLICY "Users can view spools" ON public.spools
    FOR SELECT USING (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage spools" ON public.spools;
CREATE POLICY "Users can manage spools" ON public.spools
    FOR ALL USING (company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid()));

-- =====================================================
-- 4. TRIGGER: AUTO-GENERATE SPOOLS FROM WELDS
-- =====================================================

-- Function to sync spools when welds are inserted/updated
CREATE OR REPLACE FUNCTION sync_spool_from_weld()
RETURNS TRIGGER AS $$
DECLARE
    target_spool_id UUID;
    w_rev_id UUID;
    w_spool_num TEXT;
    w_proj_id UUID;
    w_comp_id UUID;
BEGIN
    -- Determine operation values
    IF (TG_OP = 'DELETE') THEN
        w_rev_id := OLD.revision_id;
        w_spool_num := OLD.spool_number;
        w_proj_id := OLD.project_id;
        w_comp_id := OLD.company_id;
    ELSE
        w_rev_id := NEW.revision_id;
        w_spool_num := NEW.spool_number;
        w_proj_id := NEW.project_id;
        w_comp_id := NEW.company_id;
    END IF;

    -- 1. Ensure Spool Exists (only for INSERT/UPDATE)
    IF (TG_OP != 'DELETE') THEN
        INSERT INTO public.spools (revision_id, project_id, company_id, spool_number)
        VALUES (w_rev_id, w_proj_id, w_comp_id, w_spool_num)
        ON CONFLICT (revision_id, spool_number) DO NOTHING;
    END IF;

    -- 2. Update Spool Statistics (Weld Counts)
    -- We select the spool_id first to verify existence
    SELECT id INTO target_spool_id FROM public.spools 
    WHERE revision_id = w_rev_id AND spool_number = w_spool_num;

    IF found THEN
        UPDATE public.spools S
        SET 
            updated_at = NOW(),
            total_welds = (SELECT COUNT(*) FROM spools_welds WHERE revision_id = w_rev_id AND spool_number = w_spool_num),
            shop_welds = (SELECT COUNT(*) FROM spools_welds WHERE revision_id = w_rev_id AND spool_number = w_spool_num AND (weld_location = 'SHOP' OR weld_location IS NULL)), -- Default to SHOP if null
            field_welds = (SELECT COUNT(*) FROM spools_welds WHERE revision_id = w_rev_id AND spool_number = w_spool_num AND weld_location = 'FIELD')
        WHERE id = target_spool_id;
    END IF;

    -- 3. Cleanup: If a spool has 0 welds left after DELETE, maybe delete it? 
    -- For now, we prefer to keep it unless explicitly cleaned, or we can auto-delete.
    -- Let's auto-delete if 0 welds to keep it clean.
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.spools 
        WHERE id = target_spool_id AND total_welds = 0;
    END IF;

    RETURN NULL; -- After trigger, return value doesn't matter much
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS trg_sync_spool_from_weld ON public.spools_welds;
CREATE TRIGGER trg_sync_spool_from_weld
    AFTER INSERT OR UPDATE OR DELETE ON public.spools_welds
    FOR EACH ROW
    EXECUTE FUNCTION sync_spool_from_weld();

-- =====================================================
-- 5. VERIFICATION & REPAIR
-- =====================================================

-- If spools_welds already has data, populate spools table now
INSERT INTO public.spools (revision_id, project_id, company_id, spool_number)
SELECT DISTINCT revision_id, project_id, company_id, spool_number
FROM public.spools_welds
ON CONFLICT (revision_id, spool_number) DO NOTHING;

-- Update stats for initial load
UPDATE public.spools S
SET 
    total_welds = (SELECT COUNT(*) FROM spools_welds W WHERE W.revision_id = S.revision_id AND W.spool_number = S.spool_number),
    shop_welds = (SELECT COUNT(*) FROM spools_welds W WHERE W.revision_id = S.revision_id AND W.spool_number = S.spool_number AND (W.weld_location = 'SHOP' OR W.weld_location IS NULL)),
    field_welds = (SELECT COUNT(*) FROM spools_welds W WHERE W.revision_id = S.revision_id AND W.spool_number = S.spool_number AND W.weld_location = 'FIELD');

