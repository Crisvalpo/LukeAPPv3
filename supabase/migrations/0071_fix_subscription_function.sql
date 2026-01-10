-- Fix for get_company_subscription_info function
-- Type casting issue: subscription_tier ENUM vs subscription_plans.id TEXT

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
    JOIN public.subscription_plans sp ON c.subscription_tier::text = sp.id
    WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix for can_create_user function
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
    JOIN public.subscription_plans sp ON c.subscription_tier::text = sp.id
    WHERE c.id = p_company_id;
    
    RETURN current_users_count < plan_max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix for can_create_project function
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
    JOIN public.subscription_plans sp ON c.subscription_tier::text = sp.id
    WHERE c.id = p_company_id;
    
    RETURN current_projects_count < plan_max_projects;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
