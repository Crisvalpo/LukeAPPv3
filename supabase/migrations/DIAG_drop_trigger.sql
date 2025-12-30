-- DISABLE TRIGGER TEMPORARILY
-- To diagnose if "Database error finding user" is caused by the trigger failing
-- We will restore it later if this turns out to be the cause (and fix it properly)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verification
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
