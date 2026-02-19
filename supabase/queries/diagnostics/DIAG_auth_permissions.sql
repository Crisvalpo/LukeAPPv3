-- DIAGNOSTIC: Auth Schema Permissions and Configuration

-- 1. Verificar permisos del service_role sobre auth schema
SELECT 
    nspname as schema_name,
    nspowner::regrole as owner,
    has_schema_privilege('service_role', nspname, 'USAGE') as service_role_usage,
    has_schema_privilege('authenticated', nspname, 'USAGE') as authenticated_usage,
    has_schema_privilege('anon', nspname, 'USAGE') as anon_usage
FROM pg_namespace
WHERE nspname IN ('auth', 'public', 'extensions');

-- 2. Verificar permisos sobre auth.users
SELECT 
    has_table_privilege('service_role', 'auth.users', 'SELECT') as service_role_select,
    has_table_privilege('service_role', 'auth.users', 'UPDATE') as service_role_update,
    has_table_privilege('authenticated', 'auth.users', 'SELECT') as authenticated_select;

-- 3. Verificar search_path de roles críticos
SELECT 
    rolname,
    rolconfig
FROM pg_roles
WHERE rolname IN ('postgres', 'service_role', 'authenticated', 'anon', 'supabase_auth_admin');

-- 4. Verificar triggers en auth.users que puedan interferir
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- 5. Verificar si RLS está habilitado en auth.users (NO debería estarlo)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' AND tablename = 'users';

-- 6. Verificar policies en auth.users (NO debería haber ninguna)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';
