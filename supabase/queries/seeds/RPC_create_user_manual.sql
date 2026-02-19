-- Enable pgcrypto if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- MANUAL USER CREATION RPC
-- Modified to accept PLAIN PASSWORD and hash it internally using pgcrypto.
-- This avoids bcrypt version mismatches ($2a$ vs $2b$) between client and server.

-- MANUAL USER CREATION RPC V2
-- Changed name to force schema refresh

-- RPC to create user manually (Bypassing Admin API issues)
-- V3: Includes public.users insert and proper identities provider_id.

DROP FUNCTION IF EXISTS public.create_auth_user_manual_v2(text, text, text);

CREATE OR REPLACE FUNCTION public.create_auth_user_manual_v2(
    email_input text,
    password_plain_input text,
    full_name_input text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id uuid;
    v_exists boolean;
    v_encrypted_pw text;
BEGIN
    RAISE NOTICE 'Running create_auth_user_manual_v2 (V3: With Public Insert)';

    -- 1. Check if user exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = email_input
        UNION
        SELECT 1 FROM auth.identities WHERE email = email_input
    ) INTO v_exists;

    IF v_exists THEN
        RAISE EXCEPTION 'User or Identity already exists for %', email_input;
    END IF;

    -- Generate Hash locally in DB
    v_encrypted_pw := crypt(password_plain_input, gen_salt('bf'));

    v_user_id := uuid_generate_v4();

    -- 2. Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        email_input,
        v_encrypted_pw, -- Use DB generated hash
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', full_name_input),
        now(),
        now(),
        false
    );

    -- 3. Insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at
    ) VALUES (
        uuid_generate_v4(),
        v_user_id,
        jsonb_build_object(
            'sub', v_user_id,
            'email', email_input,
            'email_verified', true,
            'phone_verified', false,
            'full_name', full_name_input
        ),
        'email',
        v_user_id::text,
        now(),
        now()
    );

    -- 4. Insert into public.users (CRITICAL: mimicking the trigger that we nuked)
    -- This ensures consistency if other parts of the system expect this record.
    INSERT INTO public.users (
        id,
        email,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        email_input,
        full_name_input,
        now(),
        now()
    );
    -- Note: Adjust columns based on actual public.users schema if different.
    -- (Assuming standard columns or based on what handle_new_user usually does)

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
