-- FORENSIC DIAGNOSTIC
-- 1. Check a user
SELECT id, instance_id, email, created_at, last_sign_in_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. List Triggers
SELECT 
    event_object_schema as schema,
    event_object_table as table,
    trigger_name,
    action_timing,
    event_manipulation as event,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 3. TEST UPDATE (Simulate Login Update)
DO $$
DECLARE
    v_email text;
BEGIN
    SELECT email INTO v_email FROM auth.users ORDER BY created_at DESC LIMIT 1;
    IF v_email IS NOT NULL THEN
        RAISE NOTICE 'Testing UPDATE on %', v_email;
        UPDATE auth.users SET last_sign_in_at = now() WHERE email = v_email;
        RAISE NOTICE 'UPDATE SUCCESS';
    ELSE
        RAISE NOTICE 'No user found to test update.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'UPDATE FAILED: %', SQLERRM;
END $$;
