-- Add UPDATE policy for Founders to update their own company
-- Migration: 0100_founder_update_company_policy.sql
-- Date: 2026-01-15

-- Allow Founders to update their own company
CREATE POLICY "Founder update own company" ON public.companies FOR UPDATE USING (
    id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);
