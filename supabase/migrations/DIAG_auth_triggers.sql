-- List all triggers on auth.users
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement as statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- Also check if there are any other constraints or indexes that might be broken
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'users';

SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'auth' AND tablename = 'users';
