-- Migration 0032: Fix RLS Policies for MTO
-- Replaces incorrect JWT-based policies with standard public.members lookup

-- =====================================================
-- 1. FIX SPOOLS_MTO
-- =====================================================

DROP POLICY IF EXISTS "spools_mto_company_isolation" ON public.spools_mto;

CREATE POLICY "Users can view spools_mto"
    ON public.spools_mto
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage spools_mto"
    ON public.spools_mto
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM public.members WHERE user_id = auth.uid()
        )
    );
