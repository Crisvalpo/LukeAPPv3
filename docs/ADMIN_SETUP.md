# Configuración del Usuario "Genesis" (Super Admin)

Debido a que el sistema protege la creación de roles `super_admin`, el primer usuario del sistema debe ser creado manualmente ("bootstrapping").

## Paso 1: Crear Usuario de Autenticación
1. Ir al **Panel de Supabase** -> **Authentication** -> **Users**.
2. Click en **Add User**.
3. Ingresar credenciales (ej. `admin@lukeapp.test`).
4. **IMPORTANTE**: Marcar la casilla **"Auto Confirm User"**.
   * *Esto evita problemas de verificación de email en entornos de desarrollo/iniciales.*
5. Click en **Create User**.
6. Copiar el `User UID` generado (ej. `a1b2c3d4-...`).

## Paso 2: Asignar Rol Super Admin (SQL)
Una vez creado el usuario en Auth, debemos darle permisos en la tabla `public.members`. Ejecuta este script en el **SQL Editor** de Supabase:

```sql
-- Reemplaza 'TU_USER_ID_AQUI' con el UID copiado del dashboard
DO $$
DECLARE
  target_user_id uuid := 'TU_USER_ID_AQUI'; -- <--- PEGA EL UID AQUÍ
  lukeapp_hq_id uuid;
BEGIN
  -- 1. Obtener ID de la empresa central
  SELECT id INTO lukeapp_hq_id FROM public.companies WHERE slug = 'lukeapp-hq';

  -- 2. Insertar membresía Super Admin
  INSERT INTO public.members (user_id, company_id, role_id)
  VALUES (target_user_id, lukeapp_hq_id, 'super_admin')
  ON CONFLICT (user_id, company_id, project_id) DO NOTHING;

  RAISE NOTICE '✅ Usuario Genesis configurado exitosamente para %', target_user_id;
END $$;
```

## Paso 3: Verificación
1. Inicia sesión en la app con el nuevo usuario.
2. Deberías ser redirigido automáticamente a `/staff` (Panel de Super Admin).
