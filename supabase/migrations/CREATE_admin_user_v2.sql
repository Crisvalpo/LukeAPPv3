-- Script para CREAR DESDE CERO al usuario admin@lukeapp.test
-- (Ya que SEED_genesis creó luke@lukeapp.com)

DO $$
DECLARE
    v_company_slug text := 'lukeapp-hq';
    v_company_id uuid;
    v_user_id uuid := uuid_generate_v4();
    v_email text := 'admin@lukeapp.test';
    v_password text := 'FounderPass2025!'; -- Contraseña solicitada
BEGIN
    RAISE NOTICE '🚀 Creando usuario manual: %', v_email;

    -- 1. Obtener ID de la empresa (creada por genesis)
    SELECT id INTO v_company_id FROM public.companies WHERE slug = v_company_slug;
    
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Compañía % no encontrada. Ejecuta Full Database Setup primero.', v_company_slug;
    END IF;

    -- 2. Insertar/Verificar auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
            crypt(v_password, gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', 'Luke Admin Test'),
            now(), now()
        );
        RAISE NOTICE '✅ auth.users creado';
        
        -- 3. Identidad (para GoTrue moderno)
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(), v_user_id,
            jsonb_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true),
            'email', v_user_id::text, now(), now(), now()
        );
        RAISE NOTICE '✅ auth.identities creado';
        
    ELSE
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
        RAISE NOTICE 'ℹ️ El usuario ya existía en auth.';
        
        -- Actualizar password por si acaso
        UPDATE auth.users 
        SET encrypted_password = crypt(v_password, gen_salt('bf')) 
        WHERE id = v_user_id;
    END IF;

    -- 4. Asegurar public.users (el trigger debería haberlo hecho, pero aseguramos)
    INSERT INTO public.users (id, email, full_name)
    VALUES (v_user_id, v_email, 'Luke Admin Test')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 5. Asignar rol super_admin
    INSERT INTO public.members (user_id, company_id, role_id)
    VALUES (v_user_id, v_company_id, 'super_admin')
    ON CONFLICT (user_id, company_id, project_id) DO NOTHING;

    RAISE NOTICE '🎉 Usuario creado exitosamente!';
    RAISE NOTICE 'Login: %', v_email;
    RAISE NOTICE 'Pass: %', v_password;

END $$;
