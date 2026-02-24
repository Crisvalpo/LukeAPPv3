-- RESET SPECIFIC COMPANY: 1aff903b-a798-467f-9576-10e69a4512f8
-- FIX: Deletes Company FIRST (to clear transmittals/FKs), THEN deletes exclusively associated Users.

BEGIN;

DO $$
DECLARE
    target_company_id uuid := '1aff903b-a798-467f-9576-10e69a4512f8';
    users_to_delete uuid[];
BEGIN
    -- 1. Safety Check: Ensure we are NOT deleting a protected company
    PERFORM 1 FROM public.companies WHERE id = target_company_id AND name = 'LukeAPP HQ';
    IF FOUND THEN
        RAISE EXCEPTION 'Aborted: Attempting to delete LukeAPP HQ!';
    END IF;

    -- 2. Identify Users to delete (those exclusive to this company)
    -- We must capture these IDs BEFORE deleting the company, because deleting the company
    -- will delete the 'members' records we need to check.
    SELECT ARRAY_AGG(user_id) INTO users_to_delete
    FROM public.members
    WHERE company_id = target_company_id
    AND user_id NOT IN (
        SELECT user_id
        FROM public.members
        WHERE company_id != target_company_id
    );

    -- 3. Delete Company (Cascades to Projects -> Transmittals, Members, etc.)
    -- This removes the 'transmittals' records that were blocking user deletion via FK.
    DELETE FROM public.companies WHERE id = target_company_id;

    -- 4. Delete Users
    -- Now that the dependent records (transmittals) are gone, we can safely delete the users.
    IF users_to_delete IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = ANY(users_to_delete);
        RAISE NOTICE 'Deleted % users.', array_length(users_to_delete, 1);
    ELSE
        RAISE NOTICE 'No exclusive users found to delete.';
    END IF;

    RAISE NOTICE 'Company % deleted successfully.', target_company_id;

END $$;

COMMIT;
