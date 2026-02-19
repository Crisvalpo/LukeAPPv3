-- ÚLTIMA OPCIÓN: Investigar estado completo del proyecto y buscar alternativas

-- 1. Ver configuración actual de GoTrue (si es accesible)
SELECT * FROM auth.config;

-- 2. Ver si hay alguna forma de acceder con más privilegios
SELECT current_user, session_user, current_database();

-- 3. Listar TODOS los roles y sus privilegios
SELECT 
    r.rolname,
    r.rolsuper,
    r.rolinherit,
    r.rolcreaterole,
    r.rolcreatedb,
    r.rolcanlogin,
    ARRAY(
        SELECT b.rolname
        FROM pg_catalog.pg_auth_members m
        JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
        WHERE m.member = r.oid
    ) as memberof
FROM pg_catalog.pg_roles r
WHERE r.rolname !~ '^pg_'
ORDER BY 1;

-- 4. Ver el owner exacto de auth.users
SELECT 
    t.tablename,
    t.tableowner,
    c.relacl as table_acl
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'auth' AND t.tablename = 'users';
