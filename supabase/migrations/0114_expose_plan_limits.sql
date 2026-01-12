-- Update get_company_subscription_info to return BOTH plan limits and effective limits
-- allowing the frontend to show "Plan: X + Extra: Y" logic.

DROP FUNCTION IF EXISTS public.get_company_subscription_info(uuid);

CREATE OR REPLACE FUNCTION public.get_company_subscription_info(p_company_id uuid)
RETURNS TABLE (
    tier text,
    status text,
    end_date timestamptz,
    current_users int,
    max_users int,           -- Effective limit (Plan or Override)
    plan_max_users int,      -- Base plan limit
    current_projects int,
    max_projects int,        -- Effective limit
    plan_max_projects int,   -- Base plan limit
    current_spools int,
    max_spools int,
    current_storage_gb numeric,
    max_storage_gb numeric,
    is_active boolean
) AS $$
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
        -- Effective Users Limit: Use custom if set, otherwise plan limit
        COALESCE(c.custom_users_limit, sp.max_users),
        sp.max_users, -- Base Plan Limit
        (SELECT COUNT(*)::int FROM public.projects WHERE company_id = p_company_id),
        -- Effective Projects Limit
        COALESCE(c.custom_projects_limit, sp.max_projects),
        sp.max_projects, -- Base Plan Limit
        (SELECT COUNT(*)::int FROM public.spools WHERE company_id = p_company_id),
        sp.max_spools,
        ROUND((v_storage_bytes::numeric / 1073741824.0), 4),
        sp.max_storage_gb,
        (c.subscription_status = 'active')
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
