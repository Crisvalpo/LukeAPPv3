# Reporte de Sesión: Corrección Flujo de Invitaciones y Routing
**Fecha:** 25 de Diciembre, 2025
**Objetivo:** Estabilizar el flujo de invitación (Email + Aceptación + Redirección) para múltiples roles (Founder, Admin).

## 🚨 Problemas Críticos Encontrados

### 1. Fallo en Redirección de Email (Critical)
- **Síntoma:** Al confirmar el email, Supabase no redirigía a la página `/invitations/confirm` debido a restricciones de Whitelist en producción/local no configuradas.
- **Consecuencia:** El usuario quedaba "Confirmado" pero sin "Membresía" (Role: NONE), cayendo al Lobby sin poder salir.
- **Solución:** Implementación de **Auto-Accept en Middleware**.
  - Si un usuario está autenticado + no tiene membresía + tiene invitación pendiente → El middleware acepta la invitación automáticamente y recarga la página.

### 2. Recursión Infinita en RLS (Critical)
- **Síntoma:** Error `infinite recursion` al consultar la tabla `companies`.
- **Causa:** Políticas RLS que dependían de funciones que consultaban la misma tabla.
- **Solución:** Simplificación de políticas RLS.
  - `companies`: Visible si eres miembro de ella (consulta directa a `members`).
  - `members`: Visible si eres `super_admin` o si perteneces a la misma empresa.

### 3. Routing de Administradores
- **Síntoma:** Usuarios con rol `admin` eran enviados a `/founder` pero recibían errores `406 Not Acceptable`.
- **Causa:** La página `/founder` filtraba estrictamente por `role_id = 'founder'`, excluyendo a los admins.
- **Solución:**
  - Middleware: Separa rutas → `admin` va a `/admin`, `founder` va a `/founder`.
  - Dashboard: Se actualizó la consulta en `/founder` para permitir visualización a roles `admin` (si fuera necesario compartir vistas).

### 4. Errores 404 en Lobby
- **Síntoma:** Llamadas fallidas a RPC `get_total_profiles`.
- **Solución:** Se creó la función RPC en la base de datos para contar usuarios únicos en `members` y `users`.

## ✅ Estado Final del Sistema

### Flujo de Invitación Correcto
1. Staff invita a Founder/Admin.
2. Usuario recibe email y crea contraseña.
3. Usuario confirma email (Redirección a landing/lobby).
4. **Middleware detecta invitación pendiente y la acepta automáticamente.**
5. Middleware redirige al dashboard correcto según rol.

### Rutas por Rol
- **Super Admin (`super_admin`)** → `/staff`
- **Founder (`founder`)** → `/founder`
- **Admin (`admin`)** → `/admin`
- **Worker/Supervisor** → `/lobby` (Selección de contexto)

## 🛠️ Scripts de Utilidad Creados
- `scripts/check_memberships.js`: Verifica estado completo de usuario (Auth, Member, Invitation).
- `scripts/fix_companies_rls.js`: Aplica políticas RLS correctas para `companies`.
- `scripts/create_get_total_profiles.js`: Crea la función RPC para contadores.
- `scripts/create_accept_invitation_function.js`: Crea la función RPC crítica para aceptar invitaciones.

## 📝 Notas para Futuro
- Si se requiere volver a usar la página `/invitations/confirm`, se debe agregar `http://localhost:3000/invitations/confirm` a la whitelist de Supabase.
- El middleware actua como "red de seguridad" para cualquier invitación no procesada.
