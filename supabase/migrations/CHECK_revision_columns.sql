-- Query to check actual columns in engineering_revisions
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'engineering_revisions'
ORDER BY ordinal_position;
