-- Migration script for subscription_plans
-- Includes Enum creation, Table creation, Data insertion, and RLS policies

-- ============================================
-- 1. Create Enum Type if not exists
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE public.subscription_tier AS ENUM ('starter', 'pro', 'enterprise');
    END IF;
END $$;

-- ============================================
-- 2. Create Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id public.subscription_tier PRIMARY KEY,
    name text NOT NULL,
    price_monthly numeric NOT NULL,
    max_users integer NOT NULL,
    max_projects integer NOT NULL,
    max_spools integer,
    created_at timestamp with time zone DEFAULT now(),
    max_storage_gb numeric DEFAULT 1,
    features jsonb DEFAULT '[]'::jsonb
);

-- ============================================
-- 3. Enable RLS
-- ============================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create Policies
-- ============================================

-- Policy: subscription_plans_public_select
-- Everyone can view subscription plans
DROP POLICY IF EXISTS subscription_plans_public_select ON public.subscription_plans;
CREATE POLICY subscription_plans_public_select ON public.subscription_plans
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy: Super Admins can update plans
DROP POLICY IF EXISTS "Super Admins can update plans" ON public.subscription_plans;
CREATE POLICY "Super Admins can update plans" ON public.subscription_plans
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT members.user_id
            FROM members
            WHERE members.role_id = 'super_admin'::user_role
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT members.user_id
            FROM members
            WHERE members.role_id = 'super_admin'::user_role
        )
    );

-- ============================================
-- 5. Insert Data
-- ============================================
INSERT INTO public.subscription_plans (id, name, price_monthly, max_users, max_projects, max_spools, created_at, max_storage_gb, features)
VALUES 
('starter', 'Starter', 290000.00, 3, 1, 70, '2026-01-10 18:47:59.176616+00', 1.000, '["Soporte por email", "Gestión básica de proyectos"]'::jsonb),
('pro', 'Pro', 490000.00, 10, 3, 1500, '2026-01-10 18:47:59.176616+00', 10.000, '["Soporte prioritario", "Reportes avanzados", "Integraciones básicas"]'::jsonb),
('enterprise', 'Enterprise', 990000.00, 100, 10, 10000, '2026-01-10 18:47:59.176616+00', 100.000, '["Soporte dedicado 24/7", "Onboarding asistido", "Gestor de cuenta dedicado"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    max_users = EXCLUDED.max_users,
    max_projects = EXCLUDED.max_projects,
    max_spools = EXCLUDED.max_spools,
    max_storage_gb = EXCLUDED.max_storage_gb,
    features = EXCLUDED.features;
