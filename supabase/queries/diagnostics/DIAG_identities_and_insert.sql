-- 1. Check Triggers on auth.identities
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'identities';

-- 2. Try RAW INSERT of a clean test user
DO $$
DECLARE
    v_user_id uuid := uuid_generate_v4();
    v_email text := 'test_sql_insert_1@example.com';
BEGIN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email, 
        '$2a$10$abcdefghijklmnopqrstuvwxyzABC', -- dummy hash
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Test SQL"}', false
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, created_at, updated_at, email
    ) VALUES (
        v_user_id, v_user_id, 
        jsonb_build_object('sub', v_user_id, 'email', v_email), 
        'email', now(), now(), v_email
    );
    
    RAISE NOTICE 'SUCCESS: User inserted via SQL. ID: %', v_user_id;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FAILED: SQL Insert Error: %', SQLERRM;
END $$;
