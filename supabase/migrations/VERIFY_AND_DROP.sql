-- VERIFY 0047 Application
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
SELECT prosrc FROM pg_proc WHERE proname = 'accept_invitation';

-- DROP TRIGGER (Force failure path)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- CONFIRM DROP
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
