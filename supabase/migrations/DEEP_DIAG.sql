-- List Triggers on auth.users
SELECT 
    trigger_name, 
    action_timing, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- List Constraints on public.users
SELECT 
    conname as constraint_name, 
    contype as constraint_type, 
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE n.nspname = 'public' 
AND conrelid = 'public.users'::regclass;

-- Check if user exists in auth.users (Zombie check)
SELECT id, email, created_at FROM auth.users WHERE email = 'cristianluke@gmail.com';
