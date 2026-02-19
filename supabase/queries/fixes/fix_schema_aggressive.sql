-- Comprehensive fix for schema access
-- 1. Database-wide search_path
ALTER DATABASE postgres SET search_path = "$user", public, auth, extensions;

-- 2. Explicit role search_path updates
ALTER ROLE postgres SET search_path = "$user", public, auth, extensions;
ALTER ROLE authenticated SET search_path = "$user", public, auth, extensions;
ALTER ROLE anon SET search_path = "$user", public, auth, extensions;
ALTER ROLE service_role SET search_path = "$user", public, auth, extensions;
ALTER ROLE authenticator SET search_path = "$user", public, auth, extensions;

-- Try fixing auth admin roles specifically
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        ALTER ROLE supabase_auth_admin SET search_path = "$user", public, auth, extensions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        ALTER ROLE supabase_admin SET search_path = "$user", public, auth, extensions;
    END IF;
END $$;

-- 3. Schema permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, authenticator;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role, authenticator;

-- 4. Auth specific permissions
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role;

-- Grant to auth admin if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
        GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;
    END IF;
END $$;
