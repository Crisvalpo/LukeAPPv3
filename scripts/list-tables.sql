SELECT 
    table_schema,
    table_name,
    obj_description((table_schema || '.' || table_name)::regclass, 'pg_class') AS description
FROM information_schema.tables
WHERE table_schema IN ('public', 'storage', 'auth')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
