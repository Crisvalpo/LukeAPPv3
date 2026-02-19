-- Check public.users for test user
SELECT id, email, created_at FROM public.users 
WHERE email LIKE 'test_token_%' 
ORDER BY created_at DESC LIMIT 1;

-- Check auth.users for test user (Detailed)
SELECT id, instance_id, aud, role, email, email_confirmed_at, confirmation_token, recovery_token, created_at 
FROM auth.users 
WHERE email LIKE 'test_token_%' 
ORDER BY created_at DESC LIMIT 1;

-- Check auth.users for Working +v3 user (Detailed)
SELECT id, instance_id, aud, role, email, email_confirmed_at, confirmation_token, recovery_token, created_at 
FROM auth.users 
WHERE email = 'cristianluke+v3@gmail.com';

-- Check ALL triggers on auth.users
SELECT event_object_schema as table_schema,
       event_object_table as table_name,
       trigger_name,
       event_manipulation as event,
       action_orientation as orientation,
       action_timing as timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
