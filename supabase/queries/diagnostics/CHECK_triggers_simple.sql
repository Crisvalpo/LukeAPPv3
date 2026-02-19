-- List Triggers on auth.users (Simple)
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';
