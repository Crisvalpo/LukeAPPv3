-- GENESIS SEED SCRIPT
-- Creates the initial environment for LukeAPP V3
-- 1. Creates "LukeAPP HQ" Company
-- 2. Creates "luke@lukeapp.com" (Staff User)
-- 3. Assigns "super_admin" role

DO $$
DECLARE
    v_company_id uuid;
    v_user_id uuid;
    v_email text := 'luke@lukeapp.com';
    v_password text := 'LukeAPP_2025!'; -- Change immediately after login
BEGIN
    RAISE NOTICE '🚀 Starting GENESIS Sequence...';

    -- 1. Create LukeAPP HQ Company
    INSERT INTO public.companies (name, slug)
    VALUES ('LukeAPP HQ', 'lukeapp-hq')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_company_id;
    
    RAISE NOTICE '✅ Company created: LukeAPP HQ (%)', v_company_id;

    -- 2. Create Staff User (in auth.users)
    -- We assume clean state, but handle conflict
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
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
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4(),
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', 'Luke Staff'),
            now(),
            now()
        ) RETURNING id INTO v_user_id;
        
        RAISE NOTICE '✅ Auth User created: %', v_email;

        -- 3. Create Identity (REQUIRED for modern GoTrue)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            v_user_id,
            jsonb_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true),
            'email',
            v_user_id::text,
            now(),
            now(),
            now()
        );
         RAISE NOTICE '✅ Identity created';
    ELSE
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
        RAISE NOTICE 'ℹ️ User already exists: %', v_user_id;
    END IF;

    -- 4. Create Public Profile (Trigger might have done it, but let's ensure)
    INSERT INTO public.users (id, email, full_name)
    VALUES (v_user_id, v_email, 'Luke Staff')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 5. Create Member Record (Staff Role)
    INSERT INTO public.members (user_id, company_id, role_id)
    VALUES (v_user_id, v_company_id, 'super_admin')
    ON CONFLICT (user_id, company_id, project_id) DO NOTHING;

    RAISE NOTICE '✅ Member assigned: super_admin @ LukeAPP HQ';
    RAISE NOTICE '🎉 GENESIS COMPLETE. Login with % / %', v_email, v_password;

END $$;
