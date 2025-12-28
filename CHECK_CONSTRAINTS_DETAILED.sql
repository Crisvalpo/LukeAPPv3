-- Check ALL constraints on engineering_revisions
SELECT 
    con.conname as constraint_name, 
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_catalog.pg_constraint con
INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'engineering_revisions';
