-- Update get_company_subscription_info to calculate real storage usage
-- It sums up the size of all files in 'project-files' bucket for the given company

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
DECLARE
    v_storage_bytes bigint;
BEGIN
    -- Calculate total storage used by the company in 'project-files' bucket
    -- Valid paths start with: {company_id}/...
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
        sp.max_users,
        (SELECT COUNT(*)::int FROM public.projects WHERE company_id = p_company_id),
        sp.max_projects,
        (SELECT COUNT(*)::int FROM public.spools WHERE company_id = p_company_id),
        sp.max_spools,
        -- Convert bytes to GB (1 GB = 1024^3 bytes = 1073741824 bytes)
        ROUND((v_storage_bytes::numeric / 1073741824.0), 4),
        sp.max_storage_gb,
        (c.subscription_status = 'active')
    FROM public.companies c
    JOIN public.subscription_plans sp ON c.subscription_tier = sp.id
    WHERE c.id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
