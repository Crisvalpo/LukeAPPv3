-- Borrado quirúrgico y definitivo del usuario genesis para limpiar el dashboard
-- Esto usa privilegios de superusuario de Postgres (SQL Editor) que saltan restricciones de API

DO $$
DECLARE
    v_user_email text := 'luke@lukeapp.com';
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;

    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '🗑️ Borrando usuario Genesis: % (ID: %)', v_user_email, v_user_id;

        -- 1. Borrar de public.members primero (por si acaso)
        DELETE FROM public.members WHERE user_id = v_user_id;
        
        -- 2. Borrar de public.invitations (si invitó a alguien)
        DELETE FROM public.invitations WHERE invited_by = v_user_id;
        
        -- 3. Borrar de public.users
        DELETE FROM public.users WHERE id = v_user_id;

        -- 4. Borrar de auth.users (la fuente de verdad)
        -- Esto debería borrar identidades y sesiones en cascada
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Usuario eliminado completamente.';
    ELSE
        RAISE NOTICE 'ℹ️ El usuario % no existe o ya fue borrado.', v_user_email;
    END IF;

END $$;
