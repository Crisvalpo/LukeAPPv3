-- FORCE INSERT into auth.users (Bypassing API)
-- Password: "Password123!" (bcrypt hash example or similar)
-- Using a dummy hash for now, user can reset password later or we set it properly if we can generate it.
-- Actually, for now, we just want the user to EXIST.

DO $$
DECLARE
    v_user_id uuid := uuid_generate_v4();
    v_email text := 'cristianluke@gmail.com';
    v_pass_hash text := '$2a$10$abcdefghijklmnopqrstuvwxyzABC'; -- Dummy hash, user cannot login with password but we can magic link
BEGIN
    -- 1. Check if email exists in identities (Cleanup orphan)
    DELETE FROM auth.identities WHERE email = v_email;
    
    -- 2. Insert User
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        v_pass_hash, 
        now(), -- Confirmed
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Cristian Luke"}',
        false,
        now(),
        now(),
        encode(gen_random_bytes(32), 'hex')
    );

    -- 3. Insert Identity (Required for Supabase Auth to work properly)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at,
        email
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        now(),
        now(),
        now(),
        v_email
    );

    RAISE NOTICE 'Manual User Insertion Successful. ID: %', v_user_id;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Manual Insertion Failed: %', SQLERRM;
END $$;
