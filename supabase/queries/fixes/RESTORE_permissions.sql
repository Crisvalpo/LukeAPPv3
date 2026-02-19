-- REPAIR PERMISSIONS
-- "Database error querying schema" usually means the connection role cannot access the schema.

-- Grant USAGE on schemas
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant access to auth tables (be careful, strict security usually applies here)
-- But for "postgres" and "service_role" (admin), they should have access.
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;

-- Ensure auth system roles have access
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- Ensure public access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, dashboard_user, supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, dashboard_user, supabase_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, dashboard_user, supabase_admin;

-- Anon/Authenticated should operate via RLS on public, so USAGE is enough usually.
-- But let's Ensure they have USAGE.

RAISE NOTICE 'Permissions restored.';
