-- 1. Asegurar que pgcrypto existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Verificar usuario
SELECT id, email, encrypted_password FROM auth.users WHERE email = 'luke@lukeapp.com';

-- 3. Forzar actualización de password con un hash nuevo generado ahora mismo
UPDATE auth.users
SET encrypted_password = crypt('LukeAPP_2025!', gen_salt('bf', 10))
WHERE email = 'luke@lukeapp.com';

-- 4. Verificar si public.users tiene el perfil (si el seed falló en los triggers)
SELECT * FROM public.users WHERE email = 'luke@lukeapp.com';
