-- DIAGNOSTIC: Check for missing RPCs and Triggers

-- 1. Check if 'get_total_profiles' exists
SELECT n.nspname as schema, p.proname as function_name, pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_total_profiles';

-- 2. Check if 'handle_new_user' exists
SELECT n.nspname as schema, p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- 3. Check triggers on auth.users
SELECT event_object_schema, event_object_table, trigger_name, action_statement, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';
