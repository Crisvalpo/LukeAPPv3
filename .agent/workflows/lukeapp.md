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