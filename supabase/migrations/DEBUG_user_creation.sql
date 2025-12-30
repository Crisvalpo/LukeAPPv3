-- Verificar si el usuario se creó
SELECT 
    'auth.users' as table_name,
    id, 
    email, 
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'cluke@eimontajes.cl'

UNION ALL

SELECT 
    'public.users' as table_name,
    id::text, 
    email, 
    created_at::timestamptz as email_confirmed_at,
    created_at
FROM public.users
WHERE email = 'cluke@eimontajes.cl';

-- Verificar invitacion
SELECT id, email, token, status, created_at
FROM public.invitations
WHERE email = 'cluke@eimontajes.cl';

-- Probar la función RPC directamente
SELECT public.create_auth_user_manual_v2(
    'test_debug_' || floor(random() * 10000)::text || '@test.com',
    'TestPassword123!',
    'Test User'
);
