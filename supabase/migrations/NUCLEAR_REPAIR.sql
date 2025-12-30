-- NUCLEAR REPAIR SCRIPT

-- 1. Try to Disable Trigger (if supported)
-- ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created; -- Might fail if not superuser

-- 2. Force Drop with CASCADE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- 3. Drop the function to be sure
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 4. Reindex Auth Tables (Fix 'Database error checking email' index corruption)
REINDEX TABLE auth.users;
REINDEX TABLE auth.identities;

-- 5. Verification: List Triggers again
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';
