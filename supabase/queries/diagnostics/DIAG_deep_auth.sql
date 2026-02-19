-- DIAGNOSTIC: Deep Dive into Auth Triggers and User State

-- 1. List ALL triggers on auth.users with their events
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement, 
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- 2. Show definition of 'handle_new_user'
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check Genesis User Data Link
SELECT 
    au.id as auth_id, 
    au.email, 
    au.encrypted_password,
    au.last_sign_in_at,
    pu.id as public_id, 
    pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'luke@lukeapp.com';

-- 4. Check if we can update the user (simulation of login update)
-- This tries to update a field that login updates, to see if it crashes.
DO $$
BEGIN
    UPDATE auth.users 
    SET last_sign_in_at = now() 
    WHERE email = 'luke@lukeapp.com';
    
    RAISE NOTICE '✅ UPDATE auth.users (last_sign_in_at) succeeded without error.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ UPDATE auth.users FAILED: %', SQLERRM;
END $$;
