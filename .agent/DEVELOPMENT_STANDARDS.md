# Estándares y Guías de Desarrollo

Guía autoritativa para contribuir al código de LukeAPP.

---

## 📁 1. Organización del Proyecto

```text
src/
├── app/            # Next.js App Router (Páginas, Layouts, Rutas de API)
├── components/     # Componentes React
│   ├── ui/         # Elementos reutilizables del Design System
│   ├── layout/     # Componentes de Sidebar, Header, Lobby
│   └── [módulo]/   # Componentes específicos (ej: procurement, engineering)
├── services/       # Lógica de Negocio (No se permiten llamadas a Supabase fuera de aquí)
├── lib/            # Configuración compartida (Cliente Supabase, Middleware)
├── styles/         # CSS Global y tokens del Design System
├── types/          # Definiciones centrales de TypeScript
└── constants/      # Enums, Rutas y Configuraciones estáticas
```

---

## 🛠️ 2. Patrones de Codificación

### Patrón de Capa de Servicio (Estricto)
Los componentes **nunca** deben interactuar con Supabase o APIs externas directamente. Todo el acceso a datos debe pasar por la capa `src/services/`.

```typescript
// ✅ CORRECTO
import { getProjectsByCompany } from '@/services/projects'
const data = await getProjectsByCompany(id)

// ❌ INCORRECTO
const { data } = await supabase.from('projects').select('*')... 
```

### Seguridad de Tipos (Type Safety)
Usar tipos estandarizados de `src/types/index.ts`. Evitar `any` a toda costa. Para resultados específicos de la base de datos, usar tipos generados si están disponibles.

### Formularios y Estados de Carga
- Implementar siempre estados `isLoading`.
- Usar el componente `InputField` para un manejo consistente de errores y etiquetas.
- Usar las variantes estándar de `Button` (`primary`, `outline`, `ghost`).

---

## 🎨 3. Estándares de Estilo

### Tailwind CSS v4
- Usar Tailwind para todo el layout, espaciado y necesidades responsivas (ej: `flex items-center gap-4`).
- Referenciar las variables de `design-system.css` para colores: `bg-[var(--color-primary)]` o preferiblemente, la utilidad de Tailwind mapeada `bg-brand-primary`.

### Convenciones de Nomenclatura
- **Componentes**: `PascalCase` (ej: `MultiDisciplineSelector.tsx`).
- **Funciones/Variables**: `camelCase` (ej: `fetchMemberContext()`).
- **Constantes**: `SCREAMING_SNAKE_CASE` (ej: `MAX_UPLOAD_SIZE`).
- **Clases CSS**: `Estándar de Tailwind` o `kebab-case` para legacy.

---

## 🔒 4. Seguridad y Entorno

### Seguridad de Credenciales
**NUNCA subir credenciales.** Incluso si parecen públicas (anon keys).
- Todas las llaves deben estar en `.env.local`.
- Usar `process.env.NEXT_PUBLIC_SUPABASE_URL`.
- Los scripts deben leer de `env:` o archivos `.env`, nunca valores hardcodeados.

### Migraciones SQL
- Crear un nuevo archivo en `supabase/migrations/` con el formato `YYYYMMDDHHMMSS_descripcion.sql`.
- Preferir la aplicación programática vía `execute_sql_direct.js` o el CLI estándar de Supabase.
- Todas las tablas DEBEN tener RLS habilitado y una política `super_admin_all_access`.

---

## 📝 5. Flujo de Trabajo de Documentación
- Mantener un `walkthrough.md` para sesiones importantes.
- Mantener un `task.md` en el directorio brain para seguimiento activo.
- Actualizar estos documentos en `.agent/` siempre que ocurran cambios arquitectónicos.

---
**Revisa el README.md para instrucciones iniciales de configuración local.**
