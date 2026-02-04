-- GRANT SUPER ADMIN PRIVILEGES
-- User: cristianluke@gmail.com
-- ID: 84246adc-2c81-407b-9155-fb8bc5044e6d

DO $$
DECLARE
    v_user_id uuid := '84246adc-2c81-407b-9155-fb8bc5044e6d';
    v_email text := 'cristianluke@gmail.com';
    v_company_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
    RAISE NOTICE '🚀 Granting Super Admin privileges to %', v_email;

    -- 1. Ensure public.users profile exists
    -- (Auth trigger should have done this, but we ensure it matches the ID)
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
        v_user_id, 
        v_email, 
        'Cristian Luke',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET 
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);

    -- 2. Ensure LukeAPP HQ Company exists
    INSERT INTO public.companies (id, name, slug, subscription_status, subscription_tier)
    VALUES (
        v_company_id,
        'LukeAPP HQ',
        'lukeapp-hq',
        'active',
        'starter'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Assign SUPER ADMIN Role
    -- We delete any existing role for this company first to be clean, then insert
    DELETE FROM public.members 
    WHERE user_id = v_user_id AND company_id = v_company_id;

    INSERT INTO public.members (
        user_id, company_id, role_id
    ) VALUES (
        v_user_id, v_company_id, 'super_admin'
    );

    RAISE NOTICE '✅ Successfully assigned super_admin role to %', v_email;

END $$;
