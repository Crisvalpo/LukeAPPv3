-- FIX: Subscription System Data & Permissions (Consolidated)
-- Seeds the subscription_plans table and creates all missing RPC functions.

-- 1. Seed subscription_plans
INSERT INTO public.subscription_plans (id, name, price_monthly, max_users, max_projects, max_spools, max_storage_gb, features)
VALUES 
    ('starter', 'Starter', 129900.00, 3, 1, 7, 0.010, '["Soporte por email", "Gestión básica de proyectos"]'::jsonb),
    ('enterprise', 'Enterprise', 999900.00, 100, 10, 10000, 100.000, '["Soporte dedicado 24/7", "Onboarding asistido", "Gestor de cuenta dedicado"]'::jsonb),
    ('pro', 'Pro', 229900.00, 10, 3, 1500, 10.000, '["Soporte prioritario", "Reportes avanzados", "Integraciones básicas"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    max_users = EXCLUDED.max_users,
    max_projects = EXCLUDED.max_projects,
    max_spools = EXCLUDED.max_spools,
    max_storage_gb = EXCLUDED.max_storage_gb,
    features = EXCLUDED.features;

-- 2. CREATE can_create_user Function
CREATE OR REPLACE FUNCTION public.can_create_user(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_users_count int;
    plan_max_users int;
BEGIN
    -- Count current users
    SELECT COUNT(*) INTO current_users_count
    FROM public.members
    WHERE company_id = p_company_id;
    
    -- Get plan limits (with custom override check)
    SELECT COALESCE(c.custom_users_limit, sp.max_users) INTO plan_max_users
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
    
    RETURN current_users_count < plan_max_users;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_create_user(uuid) TO authenticated;

-- 3. CREATE can_create_project Function
CREATE OR REPLACE FUNCTION public.can_create_project(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_projects_count int;
    plan_max_projects int;
BEGIN
    SELECT COUNT(*) INTO current_projects_count
    FROM public.projects
    WHERE company_id = p_company_id;
    
    SELECT COALESCE(c.custom_projects_limit, sp.max_projects) INTO plan_max_projects
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
    
    RETURN current_projects_count < plan_max_projects;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_create_project(uuid) TO authenticated;

-- 4. CREATE get_company_subscription_info Function
CREATE OR REPLACE FUNCTION public.get_company_subscription_info(p_company_id uuid)
RETURNS TABLE (
    subscription_tier text,
    subscription_status text,
    subscription_end_date timestamptz,
    current_users int,
    users_limit int,
    plan_users_limit int,
    current_projects int,
    projects_limit int,
    plan_projects_limit int,
    current_spools int,
    plan_spools_limit int,
    storage_used_gb numeric,
    plan_storage_limit_gb numeric,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_storage_bytes bigint;
BEGIN
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    INTO v_storage_bytes
    FROM storage.objects
    WHERE bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = p_company_id::text;

    RETURN QUERY
    SELECT 
        c.subscription_tier::text,
        c.subscription_status::text,
        c.subscription_end_date,
        (SELECT COUNT(*)::int FROM public.members WHERE company_id = p_company_id),
        COALESCE(c.custom_users_limit, sp.max_users),
        sp.max_users,
        (SELECT COUNT(*)::int FROM public.projects WHERE company_id = p_company_id),
        COALESCE(c.custom_projects_limit, sp.max_projects),
        sp.max_projects,
        (SELECT COUNT(*)::int FROM public.spools WHERE company_id = p_company_id),
        sp.max_spools,
        ROUND((v_storage_bytes::numeric / 1073741824.0), 4),
        sp.max_storage_gb,
        (c.subscription_status = 'active')
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_subscription_info(uuid) TO authenticated;

-- 5. Data Cleanup
UPDATE public.companies SET subscription_tier = 'starter' WHERE subscription_tier IS NULL;
UPDATE public.companies SET subscription_status = 'active' WHERE subscription_status IS NULL;
