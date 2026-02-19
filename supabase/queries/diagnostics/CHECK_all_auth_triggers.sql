-- Verificar TODOS los triggers en auth.users (incluyendo UPDATE)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY event_manipulation, action_timing;

-- Ver si hay funciones que fallen
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';
