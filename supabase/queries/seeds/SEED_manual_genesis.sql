-- MANUAL GENESIS SEED (Based on User Provided Data)
-- Enforces specific IDs for Company and Admin User

DO $$
DECLARE
    v_user_id uuid := '19240f98-a72a-493b-bb1b-7ecc327a78ec';
    v_company_id uuid := '00000000-0000-0000-0000-000000000000';
    v_email text := 'admin@lukeapp.test';
    v_password text := 'LukeAPP_2025!'; -- Change immediately
    v_member_id uuid := 'e66400d2-3744-4e13-8a2d-80850d9e5679';
BEGIN
    RAISE NOTICE '🚀 Starting Manual GENESIS Restore...';

    -- 1. Create LukeAPP HQ Company (Fixed ID)
    INSERT INTO public.companies (
        id, name, slug, subscription_status, subscription_tier, 
        payment_instructions, storage_used_bytes
    ) VALUES (
        v_company_id,
        'LukeAPP HQ',
        'lukeapp-hq',
        'active',
        'starter',
        'Transferir a Banco Estado, Cuenta Corriente N° 123456789. Enviar comprobante a pagos@lukeapp.cl',
        0
    )
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        slug = EXCLUDED.slug;

    RAISE NOTICE '✅ Company restored: LukeAPP HQ';

    -- 2. Create Auth User (Direct Insert for specific ID)
    -- WARNING: This requires superuser privileges (postgres role)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', 'Luke Admin Test'),
            '2025-12-30 19:51:15.461581+00',
            '2025-12-30 19:51:15.461581+00'
        );

        -- Create Identity
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, 
            last_sign_in_at, created_at, updated_at
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
        RAISE NOTICE '✅ Auth User created: %', v_email;
    ELSE
        RAISE NOTICE 'ℹ️ Auth User already exists';
    END IF;

    -- 3. Create Public Profile
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
        v_user_id, 
        v_email, 
        'Luke Admin Test', 
        '2025-12-30 19:51:15.461581+00', 
        '2025-12-30 19:51:15.461581+00'
    )
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 4. Create Member (Super Admin)
    INSERT INTO public.members (
        id, user_id, company_id, role_id, created_at, updated_at
    ) VALUES (
        v_member_id,
        v_user_id,
        v_company_id, -- Can be null for super_admin usually, but user data has 0000...
        'super_admin',
        '2026-01-21 17:44:07.720951+00',
        '2026-01-21 17:44:07.720951+00'
    )
    ON CONFLICT (id) DO UPDATE SET role_id = EXCLUDED.role_id;

    RAISE NOTICE '✅ Member restored: super_admin';

END $$;
