-- Verificar si la función existe y sus permisos
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security,
    pg_get_userbyid(p.proowner) as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%create_auth_user%'
ORDER BY p.proname;

-- Ver el código completo de la función
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'create_auth_user_manual_v2';
