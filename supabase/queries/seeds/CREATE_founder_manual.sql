-- Crear usuario manualmente para cluke@eimontajes.cl
-- Esto es un workaround temporal mientras arreglamos la función RPC

DO $$
DECLARE
    v_user_id uuid := uuid_generate_v4();
    v_password_hash text;
BEGIN
    -- Generar hash de contraseña (reemplaza 'tu_password_aqui' con la contraseña que usaste)
    v_password_hash := crypt('LukeAPP_2025!', gen_salt('bf'));
    
    -- 1. Insertar en auth.users
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
        'cluke@eimontajes.cl',
        v_password_hash,
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Cristian Luke"}',
        now(),
        now(),
        false
    );
    
    -- 2. Insertar en auth.identities
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
            'email', 'cluke@eimontajes.cl',
            'email_verified', true,
            'phone_verified', false,
            'full_name', 'Cristian Luke'
        ),
        'email',
        v_user_id::text,
        now(),
        now()
    );
    
    -- 3. Insertar en public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'cluke@eimontajes.cl',
        'Cristian Luke',
        now(),
        now()
    );
    
    RAISE NOTICE 'Usuario creado con ID: %', v_user_id;
END $$;

-- Verificar creación
SELECT 'auth.users' as table_name, id, email FROM auth.users WHERE email = 'cluke@eimontajes.cl'
UNION ALL
SELECT 'public.users', id::text, email FROM public.users WHERE email = 'cluke@eimontajes.cl';
