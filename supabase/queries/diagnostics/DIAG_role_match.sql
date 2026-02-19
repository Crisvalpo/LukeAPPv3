-- Verificación profunda de identidad y rol
SELECT 
    au.id as auth_id,
    au.email,
    m.user_id as member_user_id,
    m.role_id,
    (au.id = m.user_id) as ids_match
FROM auth.users au
LEFT JOIN public.members m ON m.user_id = au.id
WHERE au.email = 'admin@lukeapp.test';

-- Prueba simulada de la funcion (Simulando ser el usuario)
-- Nota: Esto solo funciona si conocemos el UUID exacto
DO $$
DECLARE
    target_user_id uuid;
    is_admin boolean;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@lukeapp.test';
    
    -- Simulamos la consulta como lo haría la función internamente
    SELECT EXISTS (
        SELECT 1 FROM public.members 
        WHERE user_id = target_user_id 
        AND role_id = 'super_admin'
    ) INTO is_admin;
    
    RAISE NOTICE 'User ID: %', target_user_id;
    RAISE NOTICE 'Is Super Admin (Direct Check): %', is_admin;
END $$;
