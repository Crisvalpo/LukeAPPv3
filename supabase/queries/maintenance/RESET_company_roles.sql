-- =========================================================
-- RESET COMPANY ROLES (SAFE CLEANUP)
-- =========================================================
-- This script safely removes all custom roles for a company 
-- by first unlinking them from members and invitations.
-- Use this before re-running the clone/seed script.

DO $$
DECLARE
    -- WARNING: This will affect ALL companies if you don't specify an ID.
    -- For dev/testing, we can target all. In prod, specify ID.
    target_company_id uuid; 
BEGIN
    -- OPTIONAL: Set a specific company ID here if you want to target only one
    -- target_company_id := 'your-company-uuid';

    -- 1. Unlink roles from MEMBERS (Set to NULL)
    UPDATE public.members 
    SET functional_role_id = NULL
    WHERE functional_role_id IS NOT NULL;
    
    RAISE NOTICE 'Unlinked roles from members.';

    -- 2. Unlink roles from INVITATIONS (Set to NULL)
    UPDATE public.invitations 
    SET functional_role_id = NULL
    WHERE functional_role_id IS NOT NULL;
    
    RAISE NOTICE 'Unlinked roles from invitations.';

    -- 3. Delete the ROLES
    -- Only delete roles that belong to a company (= custom/cloned roles).
    -- System templates (company_id IS NULL) are preserved if they exist.
    DELETE FROM public.company_roles 
    WHERE company_id IS NOT NULL;

    RAISE NOTICE 'Deleted all company-specific roles. Ready for re-cloning.';
END $$;
