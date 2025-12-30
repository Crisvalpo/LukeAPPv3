-- 1. Obtener ID de genesis
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'luke@lukeapp.com';
    
    RAISE NOTICE 'Genesis User ID: %', v_user_id;

    -- 2. Verificar si hay invitaciones creadas por él
    PERFORM 1 FROM public.invitations WHERE invited_by = v_user_id;
    
    IF FOUND THEN
        RAISE NOTICE '⚠️ CRITICAL: Found invitations dependent on Genesis user. Delete will fail.';
        
        -- Listar conteo
        RAISE NOTICE 'Dependent Invitations Count: %', (SELECT count(*) FROM public.invitations WHERE invited_by = v_user_id);
    ELSE
        RAISE NOTICE '✅ No dependent invitations found.';
    END IF;

    -- 3. Verificar otras dependencias posibles?
    -- public.users y members tienen CASCADE, eso está bien.
END $$;
