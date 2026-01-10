-- Drop existing function before recreating with new return structure
DROP FUNCTION IF EXISTS public.get_company_subscription_info(uuid);

-- Update get_company_subscription_info to include countdown data
CREATE OR REPLACE FUNCTION public.get_company_subscription_info(p_company_id uuid)
RETURNS TABLE (
    tier text,
    status text,
    end_date timestamptz,
    suspended_at timestamptz,
    deletion_date timestamptz,
    days_until_deletion int,
    hours_until_deletion int,
    minutes_until_deletion int,
    current_users int,
    max_users int,
    current_projects int,
    max_projects int,
    is_active boolean
) AS $$
DECLARE
    v_suspended_at timestamptz;
    v_deletion_date timestamptz;
    v_time_remaining interval;
BEGIN
    -- Get suspended_at timestamp
    SELECT c.suspended_at INTO v_suspended_at
    FROM public.companies c
    WHERE c.id = p_company_id;
    
    -- Calculate deletion date (15 days from suspension)
    IF v_suspended_at IS NOT NULL THEN
        v_deletion_date := v_suspended_at + interval '15 days';
        v_time_remaining := v_deletion_date - NOW();
    END IF;

    RETURN QUERY
    SELECT 
        c.subscription_tier::text,
        c.subscription_status::text,
        c.subscription_end_date,
        c.suspended_at,
        v_deletion_date,
        CASE 
            WHEN v_time_remaining IS NOT NULL THEN GREATEST(0, EXTRACT(day FROM v_time_remaining)::int)
            ELSE NULL
        END,
        CASE 
            WHEN v_time_remaining IS NOT NULL THEN GREATEST(0, EXTRACT(hour FROM v_time_remaining)::int)
            ELSE NULL
        END,
        CASE 
            WHEN v_time_remaining IS NOT NULL THEN GREATEST(0, EXTRACT(minute FROM v_time_remaining)::int)
            ELSE NULL
        END,
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
