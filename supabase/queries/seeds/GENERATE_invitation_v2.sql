DO $$
DECLARE
    v_company_id uuid;
    v_token text := 'invitacion-fundador-v3';
    v_email text := 'cristianluke+v3@gmail.com';
BEGIN
    -- 1. Ensure Company Exists
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, slug)
        VALUES ('LukeAPP Demo', 'lukeapp-demo')
        RETURNING id INTO v_company_id;
    END IF;

    -- 2. Clean old invites for this alias
    DELETE FROM public.invitations WHERE email = v_email;

    -- 3. Insert New Invitation
    INSERT INTO public.invitations (email, token, company_id, role_id, status)
    VALUES (v_email, v_token, v_company_id, 'founder', 'pending');
    
    RAISE NOTICE 'Invitation V3 Created. Token: %', v_token;
END $$;
