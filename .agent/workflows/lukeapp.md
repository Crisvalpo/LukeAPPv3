---
description: WORKSPACE RULES (LukeAPP)
---

## 🎯 ARCHITECTURAL RULES (CRÍTICAS)

### 1️⃣ Dual-Layer Identity (NEW - Dec 2024)

**Critical Principle**: LukeAPP separates identity into TWO layers:

#### Layer A: System Role (Security Layer)
- Controls Row Level Security (RLS) in Supabase
- Fixed values: `admin`, `supervisor`, `worker`
- Never exposed to UI directly
- Single source of truth for database access

#### Layer B: Functional Role (Job / UX Layer)
- Defined by company (dynamic, customizable)
- Examples: `Pañolero`, `Jefe de Calidad`, `Capataz`
- Controls: visible views, allowed actions, dashboard routing
- Optional (fallback to generic role based on System Role)

**Rule**: A user can operate without Functional Role, but NEVER without System Role.

### 2️⃣ Lenguaje Técnico

| Capa | Idioma |
|------|--------|
| Base de datos | Inglés |
| Tablas/Columnas | Inglés |
| Funciones/APIs | Inglés |
| Código | Inglés |
| UI/Labels | Español |

---

## 🏨 LOBBY: "HALL DEL PROYECTO"

### Definición Formal

El Lobby es el espacio común del proyecto donde el usuario:
- Confirma su contexto (Proyecto + Rol)
- Completa su identidad profesional
- Se informa del estado general del proyecto
- Recibe comunicación oficial
- Se prepara para la operación

⚠️ **El Lobby NO es un dashboard operativo**
⚠️ **El Lobby NO ejecuta acciones críticas**

**Regla:** El Lobby informa, orienta y motiva. Los Dashboards ejecutan.

### Modelo Invite-Only

- Los usuarios **NO eligen** proyectos libremente
- Cada usuario pertenece a **UN ÚNICO** proyecto, asignado mediante invitación formal
- La membresía se define **exclusivamente por invitación del Founder/Admin**
- Sin invitación → no hay proyecto → no hay aplicación
- Sin proyecto → **Empty Lobby State** (contactar admin)
- Con proyecto → **Hall del Proyecto** (acceso a las funcionalidades)

### Funcionalidades del Lobby (Fase 1 - Placeholder)

1. **Perfil del Usuario**: Foto, cargo, skills, experiencia, completitud %
2. **Estado Macro del Proyecto**: Semana actual, % avance, fase, próximo hito
3. **Galería de Avance**: Fotos destacadas, videos (curado, sin comentarios)
4. **Comunicaciones Oficiales**: Avisos, campañas de seguridad, comunicados
5. **Tareas Futuras**: Asignaciones próximas, inducciones (solo lectura)
6. **Social Light**: Intereses del usuario (capacitación, horas extra) - controlado, sin chat

### Ruta del Usuario (LEY DEL SISTEMA)

```
Landing → Auth → Lobby → Dashboard según Rol
```

- El Lobby es **obligatorio** antes de cualquier feature operativa
- Sin contexto (empresa + proyecto + rol) → Sin aplicación

---

### 3️⃣ Separación Online vs Field (CRÍTICA)

Treat Web Core (online) and Field Apps (offline-first) as separate worlds.
Do not share execution logic between them.
Only shared domain models and types are allowed.

#### Satellite App Architecture (New Jan 2026)
- **Web Core (`app.lukeapp.cl`)**: 
    - Tech: Next.js + Vanilla CSS (Glassmorphism)
    - Role: Admin, Engineering, Management
    - State: Online necessary

- **Field Satellites (`bodega.lukeapp.cl`, etc)**:
    - Tech: Next.js PWA + Tailwind CSS (Mobile First)
    - Role: Worker, Supervisor
    - State: Offline First (Service Worker + Local DB)
    - UX: Big buttons, scanner-ready, dark mode default

**Exception Rule**: While Web Core enforces Vanilla CSS, Satellite Apps MAY use Tailwind CSS for rapid mobile UI development and performance.

### 4️⃣ Offline-first real (no simulación)

Field applications must be designed as offline-first.
Never block a field action due to missing connectivity.
All actions must be stored locally and synchronized later.

### 5️⃣ Event-based thinking

Field apps must emit events, not directly mutate global state.
Synchronization must be based on ordered events and eventual consistency.

### 6️⃣ No sync assumptions

Never assume immediate synchronization.
Code must tolerate delayed, partial, or failed sync attempts.

### 7️⃣ Lobby obligatorio (con excepciones)

Operational roles (Supervisor, Worker) MUST pass through the Lobby to select context.
High-level roles (Staff, Founder, Admin) MAY have direct dashboard access (`/staff`, `/founder`) as they manage multiple contexts or a clear default one.

### 8️⃣ Roles are scoped

Roles are always scoped to a project context.
Never treat roles as global permissions.

### 9️⃣ No hidden coupling

Do not introduce hidden dependencies between apps or modules.
All communication must happen through explicit contracts.

### 🔟 Avoid premature optimization

Do not optimize for performance at the cost of clarity or correctness.
Optimize only when a real bottleneck is identified.

### 1️⃣1️⃣ If unclear, stop

If a requirement or decision is unclear or missing, do not assume.
Ask for clarification before implementing.

### 1️⃣2️⃣ Reglas Base de Vistas (Derived UI)

1. **Derive, Don't Design**: Views are derived from domain and role, not invented ad-hoc.
2. **5 Canonical Types Only**:
    - `ListView` (Table, Search, Filter)
    - `CardView` (Kanban, Status-focused)
    - `FormView` (Create/Edit Entity)
    - `DashboardView` (Read-only KPIs)
    - `ContextView` (Lobby/Hall)
3. **One View = One Primary Role**: Explicit `allowedRoles`.
4. **No Special Views**: Solve edge cases with filters or states, never new unique views.

🧾 REGLA FINAL (MUY IMPORTANTE)

LukeAPP is a long-term enterprise platform.
Any solution that cannot scale to multiple companies, projects, and teams is invalid.

---

## 🎨 DESIGN SYSTEM (Vanilla CSS)

### Regla de Estilo

**CRÍTICO:** LukeAPP usa **Vanilla CSS puro** con variables CSS. NO usar Tailwind, NO usar frameworks de componentes externos (salvo que el usuario lo solicite explícitamente).

### Variables de Color Definidas

Ubicación: `src/styles/design-system.css`

#### Backgrounds
- `--color-bg-app`: Deep dark blue-grey (hsl(220, 20%, 10%))
- `--color-bg-surface-1`: hsl(220, 15%, 14%)
- `--color-bg-surface-2`: hsl(220, 15%, 18%)

#### Glassmorphism
- `--glass-surface`: hsla(220, 15%, 16%, 0.7)
- `--glass-border`: hsla(0, 0%, 100%, 0.08)
- `--glass-shadow`: 0 8px 32px 0 rgba(0, 0, 0, 0.37)
- `--glass-blur`: blur(12px)

#### Primary Colors
- `--color-primary`: hsl(215, 90%, 55%) - Azul característico
- `--color-primary-hover`: hsl(215, 90%, 65%)
- `--color-primary-glow`: hsla(215, 90%, 55%, 0.5)

#### Semantic Colors
- `--color-success`: hsl(150, 70%, 45%)
- `--color-warning`: hsl(35, 90%, 60%)
- `--color-error`: hsl(0, 80%, 60%)
- `--color-info`: hsl(200, 80%, 55%)

#### Text Colors
- `--color-text-main`: hsl(0, 0%, 98%)
- `--color-text-muted`: hsl(220, 10%, 70%)
- `--color-text-dim`: hsl(220, 10%, 45%)

#### Spacing
- `--spacing-1` a `--spacing-12`: 4px a 48px
- Usar estas variables en vez de hardcodear valores

#### Border Radius
- `--radius-sm`: 6px
- `--radius-md`: 10px
- `--radius-lg`: 16px
- `--radius-full`: 9999px

#### Shadows
- `--shadow-1`, `--shadow-2`, `--shadow-3`
- `--shadow-glow`: 0 0 20px var(--color-primary-glow)

### Componentes UI Disponibles

Todos implementados en Vanilla CSS (`src/components/ui/`):

1. **Badge** - Etiquetas de estado
2. **Button** - Botones (variants: default, destructive, outline, secondary, ghost, link)
3. **Card** - Contenedores con Header, Content, Footer
4. **Input** - Campos de texto
5. **Tabs** - Navegación por pestañas
6. **Dialog** - Modales
7. **Select** - Menús desplegables
8. **Alert** - Avisos y alertas

### Convenciones de Estilo

1. **BEM Naming**: `.component__element--modifier`
2. **CSS en archivos separados**: Cada componente tiene su `.css`
3. **Importar CSS en componente**: `import './component.css'`
4. **Usar variables**: Siempre preferir variables CSS del design system
5. **No hardcodear colores**: Nunca usar `#fff`, `rgba()`, etc. directamente

---

## 📦 MATERIAL CATALOG (Procurement Module)

### Multi-Specification Support (Jan 2025)

**Context**: El catálogo de materiales ahora soporta múltiples especificaciones técnicas para el mismo código de identificación.

#### Database Schema Change

**Migration**: `0065_update_material_catalog_constraint.sql`

```sql
-- Dropped old constraint
ALTER TABLE material_catalog DROP CONSTRAINT IF EXISTS unique_ident_per_project;

-- New composite unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_catalog_unique_key 
ON material_catalog (project_id, ident_code, COALESCE(spec_code, ''));
```

**Behavior**:
- Mismo `ident_code` + Mismo `spec_code` = **UPDATE automático**
- Mismo `ident_code` + Diferente `spec_code` = **INSERT nuevo registro**
- Permite múltiples especificaciones del mismo material

#### Performance Optimization

**File**: `src/services/material-catalog.ts` → `bulkUploadMaterials()`

**Before**: 
- 2 queries per item (SELECT + INSERT/UPDATE)
- ~60 segundos para 2300 items

**After**:
- Batch operations: 1 SELECT + 1 INSERT + N parallel UPDATEs per chunk (100 items)
- ~5-10 segundos para 2300 items
- **10x performance improvement**

**Key Changes**:
1. Pre-fetch all existing items in chunk by `ident_code`
2. Build lookup map with key `ident|||spec`
3. Separate items into `toInsert[]` and `toUpdate[]`
4. Batch INSERT all new items
5. Parallel UPDATE existing items with `Promise.allSettled`

#### UI Improvements

**File**: `src/components/procurement/MaterialCatalogManager.tsx`

**Completed**:
1. ✅ Progress bar during upload (real-time feedback)
2. ✅ Fixed footer pagination (always visible)
3. ✅ Table limited to 8 visible rows with scroll
4. ✅ "Vaciar Catálogo" moved to Settings menu (safer)
5. ✅ Removed obsolete "Actualizar Dup" checkbox
6. ✅ Consolidated action buttons into Settings dropdown menu (`[Search] [Filters] [⚙️]`)
7. ✅ Added "Spec Code" intelligent filter
8. ✅ Added "Download Template" functionality in Settings
9. ✅ Refined table headers (Grouped "INPUTS", Sticky Headers pixel-perfect, Compact Columns)

**Pending** (next session):
- Add bulk delete with confirmation
- Add export with filters applied
- Add column sorting

#### Standards Update (Jan 2025)

1. **Icons**: Use `Lucide-React` for all UI icons (Tabs, Actions). No emojis.
   - Catalog: `Book`
   - Requests: `FileText`
   - MTO: `BarChart2`
   - Receiving: `Download`
   - Inventory: `Package`
   - Piping: `Ruler`
   - Engineering: `ClipboardList`, `Megaphone`, `Wrench`, `CheckCircle`

2. **Table Headers**:
   - Use grouped headers for related columns (e.g., Inputs 1-4).
   - Ensure sticky headers have `z-index: 20` and correct background/border to avoid visual glitches on scroll.

#### Rules

1. **Always update on exact match**: Si `(project_id, ident_code, spec_code)` existe, actualizar automáticamente
2. **Multi-tenant isolation**: Cada proyecto tiene su catálogo independiente
3. **Error transparency**: Todos los errores se reportan al usuario (no silent failures)
4. **Batch operations only**: No item-by-item processing para >100 items

#### Next Steps

- [ ] Add bulk delete with confirmation
- [ ] Add export with filters applied
- [ ] Add column sorting