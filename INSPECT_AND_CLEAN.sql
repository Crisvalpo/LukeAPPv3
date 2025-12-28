-- Inspect engineering_revisions constraints and extra policy
SELECT 
    con.constraint_name, 
    con.constraint_type,
    pg_get_constraintdef(con.oid) as definition
FROM pg_catalog.pg_constraint con
INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'engineering_revisions';

-- Remove the ghost policy
DROP POLICY IF EXISTS "eng_rev_policy" ON public.engineering_revisions;

-- Verify columns
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'engineering_revisions';
