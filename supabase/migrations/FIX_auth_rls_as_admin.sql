-- Investigar ownership de tablas auth y buscar forma de desactivar RLS

-- 1. Verificar quién es el owner de las tablas auth
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'auth';

-- 2. Verificar qué roles existen y cuáles tienen privilegios
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb
FROM pg_roles
WHERE rolname LIKE '%auth%' OR rolname LIKE '%supabase%' OR rolname = 'postgres'
ORDER BY rolname;

-- 3. Intentar desactivar RLS como supabase_auth_admin
SET ROLE supabase_auth_admin;
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens DISABLE ROW LEVEL SECURITY;
RESET ROLE;

-- 4. Verificar resultado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'auth';
