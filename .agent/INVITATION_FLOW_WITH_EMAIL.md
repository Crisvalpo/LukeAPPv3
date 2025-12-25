# 🎯 Flujo de Invitaciones - VERSIÓN FINAL (Con Email Confirmation)

## 📋 Flujo Completo

### 1. Staff Crea Invitación
- Staff/Founder crea invitación desde dashboard
- Email enviado con link: `https://app.com/invitations/accept/ABC123`

### 2. Usuario Accede a Link de Invitación
**URL**: `/invitations/accept/ABC123`
- Sistema valida el token
- Sistema verifica si el usuario ya está autenticado:
  - **SI**: Email coincide → Auto-acepta invitación → Redirige a `/`
  - **NO**: Muestra formulario de contraseña

### 3. Usuario Crea Contraseña (Usuario Nuevo)
- Ingresa contraseña + confirmación
- Se ejecuta `signUp()`:
  ```typescript
  emailRedirectTo: `${origin}/invitations/confirm?token=ABC123`
  ```
- Supabase envía email de confirmación
- **Mensaje**:
  ```
  ✨ Cuenta creada correctamente.

  Hemos enviado un correo de confirmación. 
  Por favor, revísalo y haz clic en el enlace 
  para activar tu cuenta y completar la invitación.
  ```

### 4. Usuario Confirma Email
- Hace clic en el enlace del email
- Supabase redirige a: `/invitations/confirm?token=ABC123`

### 5. Página de Confirmación
**URL**: `/invitations/confirm?token=ABC123`

**Acciones**:
1. Lee el token de invitación de query params
2. Muestra mensaje de éxito:
   ```
   ✅ ¡Cuenta Confirmada!
   Tu cuenta ha sido confirmada exitosamente.

   📧 Tu email ha sido verificado
   Redirigiendo a la página de inicio de sesión 
   para que puedas completar la aceptación de tu invitación...
   ```
3. Redirige a `/login?next=/invitations/accept/ABC123` después de 2s

### 6. Página de Login
**URL**: `/login?next=/invitations/accept/ABC123`

- Usuario ingresa email + contraseña
- Inicia sesión
- Redirige automáticamente a `/invitations/accept/ABC123` (parámetro `next`)

### 7. De Vuelta en Página de Aceptación
**URL**: `/invitations/accept/ABC123` (ahora autenticado)

- Sistema detecta: `session.user.email === invitation.email` ✅
- **Auto-acepta la invitación**
- Ejecuta `acceptInvitation(token)` → Crea membership
- Redirige a `/`

### 8. Middleware Enruta
**URL**: `/`

```typescript
if (role === 'super_admin') → /staff
else if (role === 'founder' || role === 'admin') → /founder
else → /lobby
```

### 9. Usuario en Dashboard ✅
- Autenticado
- Membership asignado
- En el dashboard correcto

## 🔄 Casos Especiales

### Caso A: Usuario Ya Autenticado con Email Correcto
1. Accede a `/invitations/accept/ABC123`
2. Sistema detecta sesión activa + email coincide
3. **Auto-acepta inmediatamente**
4. Redirige a `/`

### Caso B: Usuario Autenticado con Email Diferente
1. Accede a `/invitations/accept/ABC123`
2. Sistema muestra advertencia de conflicto
3. Usuario debe cerrar sesión
4. Continúa con flujo normal

### Caso C: Usuario Ya Tiene Cuenta
1. En vez de crear cuenta, hace clic en "Ya tengo una cuenta, iniciar sesión"
2. Va a `/login`
3. Inicia sesión
4. Vuelve manualmente al link de invitación
5. Auto-acepta

## ✅ Ventajas de Este Flujo

1. **Compatible con Email Confirmation**: No intenta procesar tokens del hash
2. **UX Clara**: Usuario sabe exactamente qué hacer en cada paso
3. **Robusto**: Funciona incluso si el usuario cierra el navegador entre pasos
4. **Flexible**: Usuario puede volver al link cuando quiera después de confirmar
5. **Sin Timing Issues**: No depende de race conditions

## 📁 Archivos Principales

1. `/invitations/accept/[token]/page.tsx`
   - Formulario de creación de cuenta
   - Auto-acepta si ya autenticado

2. `/invitations/confirm/page.tsx`
   - Mensaje de confirmación exitosa
   - Redirige a login con parámetro `next`

3. `/login/page.tsx`
   - Login normal
   - Soporte para parámetro `next` (redirección post-login)

## 🧪 Testing Checklist

- [ ] Usuario nuevo → Crear cuenta → Confirmar email → Login → Auto-acepta
- [ ] Usuario existente → Login → Acepta desde link
- [ ] Usuario ya autenticado → Auto-acepta inmediatamente
- [ ] Email conflict → Muestra advertencia
- [ ] Token inválido → Muestra error
