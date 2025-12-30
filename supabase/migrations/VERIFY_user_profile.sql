-- Verificar que el perfil público existe y es accesible
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at
FROM public.users u
WHERE u.email = 'luke@lukeapp.com';

-- Verificar membresía
SELECT 
    m.id,
    m.role_id,
    c.name as company_name,
    m.created_at
FROM public.members m
JOIN public.companies c ON c.id = m.company_id
JOIN public.users u ON u.id = m.user_id
WHERE u.email = 'luke@lukeapp.com';

-- Verificar que las policies permiten SELECT
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'members', 'companies')
ORDER BY tablename, policyname;
