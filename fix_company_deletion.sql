-- Migration 0080: Enhanced Company Deletion (Fixed)
-- Use this to override the previous version that attempted direct storage deletion
-- Direct storage deletion is removed as it's not allowed by triggers.
-- Helper logic should handle storage deletion client-side.

CREATE OR REPLACE FUNCTION public.delete_company_cascade(p_company_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_company record;
    v_days_suspended int;
    v_user_id uuid;
    v_orphan_users uuid[];
    v_deleted_users int := 0;
    v_deleted_files int := 0;
    v_project_ids uuid[];
BEGIN
    -- 1. Get company details
    SELECT * INTO v_company
    FROM public.companies
    WHERE id = p_company_id;

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

    -- Calculate days suspended
    v_days_suspended := EXTRACT(DAY FROM (NOW() - v_company.suspended_at));

    IF v_days_suspended < 15 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', format('Periodo de gracia activo. Faltan %s días para permitir la eliminación.', 15 - v_days_suspended),
            'days_remaining', 15 - v_days_suspended,
            'suspended_since', v_company.suspended_at
        );
    END IF;

    -- 4. Get all project IDs (just for reporting stats)
    SELECT ARRAY_AGG(id) INTO v_project_ids
    FROM public.projects
    WHERE company_id = p_company_id;

    -- 5. Storage Deletion REMOVED
    -- Direct deletion from storage.objects is blocked by triggers.
    -- Storage cleanup must be performed client-side or via Supabase Storage API.

    -- 6. Find Orphan Users (users that ONLY belong to this company)
    SELECT ARRAY_AGG(DISTINCT m.user_id) INTO v_orphan_users
    FROM public.members m
    WHERE m.company_id = p_company_id
    AND m.user_id NOT IN (
        SELECT user_id FROM public.members 
        WHERE company_id != p_company_id
    );

    -- 7. Delete Orphan Users from Auth
    IF v_orphan_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_orphan_users
        LOOP
            BEGIN
                DELETE FROM auth.users WHERE id = v_user_id;
                v_deleted_users := v_deleted_users + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not delete user %: %', v_user_id, SQLERRM;
            END;
        END LOOP;
    END IF;

    -- 8. Delete Company (CASCADE will handle related tables)
    DELETE FROM public.companies WHERE id = p_company_id;

    -- 9. Return Stats
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Empresa eliminada exitosamente',
        'stats', jsonb_build_object(
            'company_name', v_company.name,
            'company_id', p_company_id,
            'deleted_users', v_deleted_users,
            'deleted_files', 'handled client-side',
            'days_suspended', v_days_suspended,
            'projects_count', COALESCE(array_length(v_project_ids, 1), 0)
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', format('Error crítico: %s', SQLERRM),
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.delete_company_cascade(uuid) TO service_role, authenticated;

COMMENT ON FUNCTION public.delete_company_cascade IS 
'Safely deletes a company and ALL related data including:
- Database records (via CASCADE)
- Orphaned user accounts (auth.users)
- Storage files must be handled client-side BEFORE calling this function.
ONLY works if company is suspended for 15+ days.';
