# Configuración de URLs en Supabase

## Problema
El `emailRedirectTo` no funciona porque Supabase requiere que las URLs estén en la whitelist.

## Solución

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard/project/rvgrhtqxzfcypbfxqilp)

2. Navega a: **Authentication** → **URL Configuration**

3. En **Redirect URLs**, agrega:
   ```
   http://localhost:3000/invitations/confirm
   http://localhost:3000/**
   ```

4. En **Site URL**, asegúrate que sea:
   ```
   http://localhost:3000
   ```

5. Guarda los cambios

## Alternativa: Forzar redirect en la página de confirmación

Si no quieres configurar el dashboard, podemos hacer que la landing page detecte si el usuario acaba de confirmar su email y tenga una invitación pendiente, y redirigirlo automáticamente a aceptarla.

¿Prefieres configurar el dashboard o implementar la alternativa?
