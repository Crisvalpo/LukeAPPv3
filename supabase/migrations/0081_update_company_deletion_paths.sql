-- Migration 0081: Update company deletion to use new descriptive storage paths
-- Pattern changed from: {uuid}/{uuid}/* to {slug}-{id}/{code}-{id}/*

CREATE OR REPLACE FUNCTION public.delete_company_cascade(p_company_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_company record;
    v_days_suspended int;
    v_user_id uuid;
    v_orphan_users uuid[];
    v_deleted_users int := 0;
    v_deleted_files int := 0;
    v_company_path text;
BEGIN
    -- 1. Get company details
    SELECT * INTO v_company FROM public.companies WHERE id = p_company_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Empresa no encontrada');
    END IF;

    -- 2. Verify Suspension Status
    IF v_company.subscription_status != 'suspended' THEN
        RETURN jsonb_build_object('success', false, 'message', 'La empresa no está suspendida');
    END IF;

    -- 3. Verify Grace Period (15 days)
    IF v_company.suspended_at IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error de datos: Fecha de suspensión no registrada');
    END IF;

    v_days_suspended := EXTRACT(DAY FROM (NOW() - v_company.suspended_at));
    IF v_days_suspended < 15 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', format('Periodo de gracia activo. Faltan %s días.', 15 - v_days_suspended),
            'days_remaining', 15 - v_days_suspended
        );
    END IF;

    -- 4. Delete Storage Files (company folder: project-files/{slug}-{id}/*)
    -- New pattern: companySlug-firstUuidSegment
    -- Example: acme-construction-fd48f0e5/*
    BEGIN
        -- Extract first segment of UUID (8 chars)
        v_company_path := v_company.slug || '-' || split_part(v_company.id::text, '-', 1);
        
        -- Count files before deletion
        SELECT COUNT(*) INTO v_deleted_files 
        FROM storage.objects 
        WHERE bucket_id = 'project-files' 
          AND name LIKE v_company_path || '/%';
        
        -- Delete all files under company folder
        DELETE FROM storage.objects 
        WHERE bucket_id = 'project-files' 
          AND name LIKE v_company_path || '/%';
          
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Could not delete storage for path %: %', v_company_path, SQLERRM;
    END;

    -- 5. Find Orphan Users
    SELECT ARRAY_AGG(DISTINCT m.user_id) INTO v_orphan_users
    FROM public.members m WHERE m.company_id = p_company_id
    AND m.user_id NOT IN (SELECT user_id FROM public.members WHERE company_id != p_company_id);

    -- 6. Delete Orphan Users from Auth
    IF v_orphan_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_orphan_users LOOP
            BEGIN
                DELETE FROM auth.users WHERE id = v_user_id;
                v_deleted_users := v_deleted_users + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not delete user %', v_user_id;
            END;
        END LOOP;
    END IF;

    -- 7. Delete Company (CASCADE handles all related tables)
    DELETE FROM public.companies WHERE id = p_company_id;

    -- 8. Return Stats
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Empresa eliminada exitosamente',
        'stats', jsonb_build_object(
            'company_name', v_company.name,
            'company_slug', v_company.slug,
            'storage_path', v_company_path,
            'deleted_users', v_deleted_users,
            'deleted_files', v_deleted_files,
            'days_suspended', v_days_suspended
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_company_cascade(uuid) TO service_role, authenticated;

COMMENT ON FUNCTION public.delete_company_cascade IS 
'Safely deletes a company using descriptive storage paths: {slug}-{id}/*
ONLY works if company is suspended for 15+ days.
Deletes: storage files, database records (CASCADE), orphaned auth users.';
