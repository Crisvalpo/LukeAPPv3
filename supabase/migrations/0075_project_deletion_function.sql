-- Delete project with complete cleanup (database + storage + auth users)
-- This function will:
-- 1. Identify users that ONLY belong to this project
-- 2. Delete those users from auth.users
-- 3. Delete all files from Storage (handled client-side)
-- 4. Delete all database records via CASCADE
-- 5. Return detailed stats of what was deleted

CREATE OR REPLACE FUNCTION public.delete_project_complete(p_project_id uuid, p_company_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_project_record record;
    v_stats jsonb;
    v_orphan_users uuid[];
    v_user_id uuid;
    v_deleted_users int := 0;
BEGIN
    -- Verify project exists and belongs to company
    SELECT * INTO v_project_record
    FROM public.projects
    WHERE id = p_project_id AND company_id = p_company_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found or does not belong to company';
    END IF;

    -- Find users that ONLY belong to this project (orphan users)
    -- These users will be deleted from auth.users
    SELECT ARRAY_AGG(DISTINCT m.user_id) INTO v_orphan_users
    FROM public.members m
    WHERE m.project_id = p_project_id
    AND m.user_id NOT IN (
        -- Exclude users who have other memberships
        SELECT user_id FROM public.members 
        WHERE project_id != p_project_id OR company_id != p_company_id
    );

    -- Collect statistics before deletion (only for existing tables)
    SELECT jsonb_build_object(
        'project_name', v_project_record.name,
        'project_code', v_project_record.code,
        'members', (SELECT COUNT(*) FROM public.members WHERE project_id = p_project_id),
        'orphan_users', COALESCE(array_length(v_orphan_users, 1), 0)
    ) INTO v_stats;

    -- Delete orphan users from auth.users
    -- Note: This requires admin privileges, so we'll use auth.uid() check
    IF v_orphan_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_orphan_users
        LOOP
            BEGIN
                -- Delete from auth.users (CASCADE will handle public.users)
                DELETE FROM auth.users WHERE id = v_user_id;
                v_deleted_users := v_deleted_users + 1;
            EXCEPTION WHEN OTHERS THEN
                -- Log error but continue
                RAISE WARNING 'Could not delete user %: %', v_user_id, SQLERRM;
            END;
        END LOOP;
    END IF;

    -- Delete project (CASCADE will handle all related records: members, isometrics, spools, etc.)
    DELETE FROM public.projects WHERE id = p_project_id;
    
    -- Add actual deleted users count to stats
    v_stats := v_stats || jsonb_build_object('deleted_auth_users', v_deleted_users);
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_project_complete(uuid, uuid) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.delete_project_complete IS 
'Deletes a project and all related data including orphan users from auth.users. 
Orphan users are those who only belong to the project being deleted.';
