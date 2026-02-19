-- FIX SEARCH PATH
-- "Database error querying schema" often means missing schema in search_path.

-- Check where pgcrypto is
SELECT extname, nspname 
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid;

-- Ensure extensions schema exists in search path for all roles
-- We cannot always ALTER ROLE supabase_admin directly (cloud restriction), 
-- but we can ALTER ROLE postgres and service_role.

ALTER ROLE postgres SET search_path = "$user", public, auth, extensions;
ALTER ROLE service_role SET search_path = "$user", public, auth, extensions;
ALTER ROLE authenticated SET search_path = "$user", public, auth, extensions;
ALTER ROLE anon SET search_path = "$user", public, auth, extensions;

-- If 'supabase_auth_admin' exists, try to set it too (might fail if we lack permission)
DO $$
BEGIN
    EXECUTE 'ALTER ROLE supabase_auth_admin SET search_path = "$user", public, auth, extensions';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter supabase_auth_admin: %', SQLERRM;
END $$;

-- Also try setting database level default
-- ALTER DATABASE postgres SET search_path = "$user", public, auth, extensions;
-- (Commented out to avoid aggressive change, let's try roles first)

RAISE NOTICE 'Search paths updated.';
