-- ============================================
-- CLEAN DATABASE FOR PHASE 1 TEST (FIXED)
-- ⚠️ Only cleans public.* tables (auth.users stays)
-- ============================================

DO $$
DECLARE
    staff_member_id UUID;
BEGIN
    -- Get first super_admin member
    SELECT id INTO staff_member_id
    FROM public.members 
    WHERE role_id = 'super_admin' 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF staff_member_id IS NULL THEN
        RAISE EXCEPTION 'No super_admin found!';
    END IF;

    -- Clean all data (keep only one staff member)
    DELETE FROM public.invitations;
    DELETE FROM public.members WHERE id != staff_member_id;
    DELETE FROM public.projects;
    DELETE FROM public.companies;

    RAISE NOTICE 'Database cleaned! Staff member kept: %', staff_member_id;
END $$;

-- Verify clean state
SELECT 'companies' as tabla, COUNT(*) as registros FROM public.companies
UNION ALL SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL SELECT 'members', COUNT(*) FROM public.members
UNION ALL SELECT 'invitations', COUNT(*) FROM public.invitations
ORDER BY tabla;

-- Show remaining staff member
SELECT 
    m.id as member_id,
    m.user_id,
    m.role_id,
    m.created_at
FROM public.members m
WHERE m.role_id = 'super_admin';
