DO $$
DECLARE
    v_company_id uuid;
    v_token text := 'invitacion-fundador-123';
BEGIN
    -- 1. Ensure Company Exists
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, slug)
        VALUES ('LukeAPP Demo', 'lukeapp-demo')
        RETURNING id INTO v_company_id;
    END IF;

    -- 2. Insert Invitation (Cleanup old one if exists for this email just in case)
    DELETE FROM public.invitations WHERE email = 'cristianluke@gmail.com';

    INSERT INTO public.invitations (email, token, company_id, role_id, status)
    VALUES ('cristianluke@gmail.com', v_token, v_company_id, 'founder', 'pending');
    
    RAISE NOTICE 'Invitation Created. Token: %', v_token;
END $$;
