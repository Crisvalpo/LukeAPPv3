-- LUKEAPP V3 - PHASE 7: SUBSCRIPTION & ACCESS CONTROL
-- Fecha: 2026-01-10
-- Descripción: Sistema de suscripciones manuales con 3 tiers y control de acceso por pagos

-- 1. ENUMS

-- Estado de suscripción (estado de pago)
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'suspended');

-- Tier de suscripción (plan contratado)
CREATE TYPE public.subscription_tier AS ENUM ('starter', 'pro', 'enterprise');

-- 2. MODIFY COMPANIES TABLE

-- Agregar columnas de suscripción
ALTER TABLE public.companies 
ADD COLUMN subscription_status public.subscription_status DEFAULT 'active',
ADD COLUMN subscription_tier public.subscription_tier DEFAULT 'starter',
ADD COLUMN subscription_end_date timestamptz,
ADD COLUMN payment_instructions text DEFAULT 'Transferir a Banco Estado, Cuenta Corriente N° 123456789. Enviar comprobante a pagos@lukeapp.cl';

-- 3. SUBSCRIPTION PLANS CATALOG

-- Tabla catálogo de planes (estática)
CREATE TABLE public.subscription_plans (
    id text PRIMARY KEY, -- 'starter', 'pro', 'enterprise'
    name text NOT NULL,
    price_monthly numeric(10,2) NOT NULL,
    max_users int NOT NULL,
    max_projects int NOT NULL,
    max_spools int, -- NULL = ilimitado
    features jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 4. SEED DATA - PLANES

INSERT INTO public.subscription_plans (id, name, price_monthly, max_users, max_projects, max_spools, features) VALUES
('starter', 'Starter', 29990, 3, 1, 500, '[
    "Hasta 3 usuarios",
    "1 proyecto activo",
    "Hasta 500 spools",
    "Soporte por email"
]'::jsonb),
('pro', 'Pro', 99990, 10, 5, 5000, '[
    "Hasta 10 usuarios",
    "5 proyectos simultáneos",
    "Hasta 5,000 spools",
    "Soporte prioritario",
    "Reportes avanzados"
]'::jsonb),
('enterprise', 'Enterprise', 299990, 999999, 999999, NULL, '[
    "Usuarios ilimitados",
    "Proyectos ilimitados",
    "Spools ilimitados",
    "Soporte dedicado 24/7",
    "API personalizada",
    "Onboarding asistido"
]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    max_users = EXCLUDED.max_users,
    max_projects = EXCLUDED.max_projects,
    max_spools = EXCLUDED.max_spools,
    features = EXCLUDED.features;

-- 5. RLS POLICIES

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer los planes (para landing page)
CREATE POLICY "Public read subscription plans" ON public.subscription_plans 
FOR SELECT 
USING (true);

-- 6. HELPER FUNCTIONS

-- Función para verificar si una empresa puede crear más usuarios
CREATE OR REPLACE FUNCTION public.can_create_user(p_company_id uuid)
RETURNS boolean AS $$
DECLARE
    current_users_count int;
    plan_max_users int;
BEGIN
    -- Contar usuarios actuales de la empresa
    SELECT COUNT(*) INTO current_users_count
    FROM public.members
    WHERE company_id = p_company_id;
    
    -- Obtener límite del plan
    SELECT sp.max_users INTO plan_max_users
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
    
    RETURN current_users_count < plan_max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si una empresa puede crear más proyectos
CREATE OR REPLACE FUNCTION public.can_create_project(p_company_id uuid)
RETURNS boolean AS $$
DECLARE
    current_projects_count int;
    plan_max_projects int;
BEGIN
    -- Contar proyectos actuales de la empresa
    SELECT COUNT(*) INTO current_projects_count
    FROM public.projects
    WHERE company_id = p_company_id;
    
    -- Obtener límite del plan
    SELECT sp.max_projects INTO plan_max_projects
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
    
    RETURN current_projects_count < plan_max_projects;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener información del plan actual de una empresa
CREATE OR REPLACE FUNCTION public.get_company_subscription_info(p_company_id uuid)
RETURNS TABLE (
    tier text,
    status text,
    end_date timestamptz,
    current_users int,
    max_users int,
    current_projects int,
    max_projects int,
    is_active boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.subscription_tier::text,
        c.subscription_status::text,
        c.subscription_end_date,
        (SELECT COUNT(*)::int FROM public.members WHERE company_id = p_company_id),
        sp.max_users,
        (SELECT COUNT(*)::int FROM public.projects WHERE company_id = p_company_id),
        sp.max_projects,
        (c.subscription_status = 'active')
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMENTARIOS
COMMENT ON TABLE public.subscription_plans IS 'Catálogo de planes de suscripción disponibles';
COMMENT ON COLUMN public.companies.subscription_status IS 'Estado de pago: active, past_due (vencido con advertencia), suspended (bloqueado)';
COMMENT ON COLUMN public.companies.subscription_tier IS 'Plan contratado: starter, pro, enterprise';
COMMENT ON COLUMN public.companies.subscription_end_date IS 'Fecha de vencimiento del servicio. NULL = sin límite temporal';
COMMENT ON COLUMN public.companies.payment_instructions IS 'Instrucciones para realizar transferencia manual';
