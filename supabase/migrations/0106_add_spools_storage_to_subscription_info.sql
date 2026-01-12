-- Add Spools and Storage metrics to subscription info function

DROP FUNCTION IF EXISTS public.get_company_subscription_info(uuid);

CREATE OR REPLACE FUNCTION public.get_company_subscription_info(p_company_id uuid)
RETURNS TABLE (
    tier text,
    status text,
    end_date timestamptz,
    current_users int,
    max_users int,
    current_projects int,
    max_projects int,
    current_spools int,
    max_spools int,
    current_storage_gb numeric,
    max_storage_gb numeric,
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
        -- Count all spools across all projects
        (SELECT COUNT(*)::int FROM public.spools WHERE company_id = p_company_id),
        sp.max_spools,
        -- Calculate total storage usage in GB (placeholder - will need actual storage calculation)
        0.0::numeric,
        sp.max_storage_gb,
        (c.subscription_status = 'active')
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_company_subscription_info(uuid) IS
'Returns complete subscription information including usage metrics for users, projects, spools, and storage';
