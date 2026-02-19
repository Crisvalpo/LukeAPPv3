# 🔧 Configuración de Email Confirmación en Supabase

## Problema Actual

La confirmación de email está causando problemas porque:
1. Los tokens vienen en el hash fragment (#access_token=...)
2. El procesamiento client-side es frágil y depende de timing
3. Crea un flujo complejo y difícil de debuggear

## ✅ Solución Recomendada: Deshabilitar Email Confirmation para Dev

### Pasos en Supabase Dashboard:

1. Ve a: **Authentication** → **Providers** → **Email**
2. Deshabilita: **"Enable email confirmations"**
3. Guarda cambios

### Beneficios:
- ✅ Flujo inmediato: usuario crea contraseña → sesión activa → invitación aceptada
- ✅ Sin dependencia de email real durante desarrollo
- ✅ Testing más rápido y confiable
- ✅ Menos puntos de fallo

### Para Producción:
- Habilitar confirmación de email
- Usar flujo alternativo: confirmar → mensaje "Por favor inicia sesión" → login page
- O usar deep links de Supabase configurados correctamente

## 🚀 Acción Inmediata

**Opción 1: Deshabilitar confirmación** (Recomendado para dev)
- Ir a Supabase Dashboard
- Authentication → Settings → Email Auth
- Toggle OFF "Enable email confirmations"

**Opción 2: Configurar URL redirect correctamente**
- Authentication → URL Configuration
- Site URL: `http://localhost:3000`
- Redirect URLs: Agregar `http://localhost:3000/invitations/confirm`

¿Cuál prefieres?
