# LukeAPP v3

**Multi-tenant Industrial Piping Management Platform**

[![Repository](https://img.shields.io/badge/repo-Crisvalpo%2FLukeAPPv3-blue)](https://github.com/Crisvalpo/LukeAPPv3)
[![Phase](https://img.shields.io/badge/phase-1%20complete-green)](https://github.com/Crisvalpo/LukeAPPv3)

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Arquitectura](#-arquitectura)
- [Estado Actual](#-estado-actual)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Principios de Diseño](#-principios-de-diseño)
- [Roadmap](#-roadmap)
- [Desarrollo](#-desarrollo)

---

## 🎯 Visión General

LukeAPP es una plataforma empresarial **multi-tenant** para la gestión integral del montaje industrial de piping, diseñada para operar en:

- **Múltiples empresas** (multi-tenant)
- **Múltiples proyectos** simultáneos
- **Múltiples roles** por persona
- **Entornos con conectividad limitada** (offline-first)

### Principio Fundamental

> **Una persona no es un usuario hasta que actúa dentro de un contexto.**

El sistema separa explícitamente:
- **Identidad** → quién es la persona
- **Contexto** → empresa + proyecto + rol
- **Aplicación** → módulo funcional que ejecuta acciones

## 🧑‍🚧 Identity & Roles Model (CRÍTICO)

LukeAPP implementa un modelo de identidad de **doble capa**, diseñado para separar seguridad, función y experiencia de usuario.

### Layer A: System Role (Security Layer)
- Controla **Row Level Security (RLS)** en Supabase
- Valores estrictos:
  - `admin`
  - `supervisor`
  - `worker`
- **No define UX**
- **No define vistas**
- Es la única fuente de verdad para acceso a datos

### Layer B: Functional Role (Job / UX Layer)
- Definido por la empresa (Founder)
- Representa cargos reales de obra u oficina
- Ejemplos: `Pañolero`, `Jefe de Calidad`, `Capataz`
- Controla:
  - Vistas visibles
  - Acciones permitidas
  - Dashboard inicial
- **Es opcional**

### Regla Clave
> Un usuario puede operar sin Functional Role,
> pero **nunca** sin System Role.

Si un usuario no tiene cargo funcional asignado:
- Se aplica un perfil funcional genérico según su System Role
- El sistema nunca bloquea el acceso por falta de configuración

---

## 🏗️ Arquitectura

### Modelo: Monorepo → Deploys Independientes

```
LukeAPP/
├── apps/
│   ├── web-core/          → Lobby, Landing, Admin (ONLINE)
│   ├── field-spool/       → App terreno Spools (OFFLINE-FIRST)
│   ├── field-qa/          → App terreno QA (OFFLINE-FIRST)
│   └── field-logistics/   → App terreno Logística (OFFLINE-FIRST)
├── packages/
│   ├── domain/            → Modelos de dominio compartidos
│   ├── sync-engine/       → Motor de sincronización
│   └── ui/                → Componentes UI compartidos
└── supabase/
    └── migrations/        → Schema SQL
```

### Deploys Independientes (Vercel)

| App | Proyecto Vercel | Dominio Sugerido |
|-----|----------------|------------------|
| `web-core` | `lukeapp-web` | `app.lukeapp.cl` |
| `field-spool` | `lukeapp-field-spool` | `spool.lukeapp.cl` |
| `field-qa` | `lukeapp-field-qa` | `qa.lukeapp.cl` |
| `field-logistics` | `lukeapp-field-logistics` | `logistics.lukeapp.cl` |

**Ventajas:**
- ✅ Separación real de mundos (Online vs Offline)
- ✅ Builds independientes
- ✅ Variables de entorno aisladas
- ✅ Caché y service workers sin interferencias
- ✅ Escalabilidad de equipo

---

## 📊 Estado Actual

### ✅ **Fase 1: Foundation** (95% Complete - December 2024)

**Completado:**

#### **1. Core Infrastructure**
- ✅ Next.js 15 + App Router
- ✅ Supabase (Auth + PostgreSQL + RLS)
- ✅ 100% Vanilla CSS (no Tailwind)
- ✅ TypeScript estricto con tipos centralizados
- ✅ Multi-tenant architecture

#### **2. Multi-Tenant System**
- ✅ **Companies** - CRUD completo
  - Staff can create, edit, delete companies
  - Unique name/slug validation
  - Project & member count stats
  - RLS policies (Super Admin + Founder access)
  
- ✅ **Projects** - CRUD completo
  - Founders create projects for their company
  - Unique code per company (auto-generated)
  - Status management (planning, active, on_hold, completed, cancelled)
  - Member count stats
  - RLS policies (Super Admin + Founder manage, Members view)

- ✅ **Invitations System**
  - **Staff → Founder** (company-level invitations)
  - **Founder → Admin** (project-level invitations)
  - Email-based invitation links
  - Duplicate prevention & validation
  - Share via WhatsApp/Email
  - Revoke/delete invitations

- ✅ **Dynamic Functional Roles System**
  - **Dual-Layer Identity:** System Roles (Security) vs Functional Roles (Use/UX)
  - **Founder UI:** Create, edit, and manage custom roles
  - **Permissions:** Granular module and resource-level control
  - **Templates:** 14 Standard Piping Context roles built-in
  - **Integration:** Hooks, Components (`Can`, `HasModule`), and auto-routing

#### **3. Dashboards Implemented**

**Staff Dashboard** (`/staff`) - Super Admin Global View
- ✅ Overview with real-time statistics
- ✅ Companies management (list, create, edit, delete)
- ✅ Invitations management (invite founders)
- ✅ Recent companies & pending invitations views

**Founder Dashboard** (`/founder`) - Company-Level Management
- ✅ Auto-detect founder's company
- ✅ Projects management (list, create, stats)
- ✅ Invite admins to projects with functional roles
- ✅ View & revoke pending invitations
- ✅ Roles management (create, edit, delete custom roles)

**Admin Dashboard** (`/admin`) - Project-Level Management
- ✅ Overview with project context
- ✅ Invite supervisors/workers with functional roles
- ✅ View & manage project invitations
- 🚧 Workforce management (pending)

### ✅ **Phase 2: Revision System** (100% Complete - December 2024)

**Completado:**

#### **1. Database Architecture**
- ✅ **Engineering Revisions** - Event header for revision announcements
- ✅ **Revision Events** - Immutable event log (Event Sourcing pattern)
- ✅ **Revision Impacts** - Detected conflicts with severity classification
- ✅ **Production Mockups** - Test tables for impact detection (isometrics, spools, welds)
- ✅ **RLS Policies** - Complete multi-tenant security
- ✅ **Triggers** - Auto-update timestamps

#### **2. Backend Services**
- ✅ **Impact Detection Engine** - Conditional logic based on production status
- ✅ **Auto-Apply Logic** - Automatic application for clean updates
- ✅ **Production Status Helpers** - Classification (ENGINEERING_ONLY, FABRICATED_ONLY, IN_PROGRESS)
- ✅ **Event Emitters** - Immutable audit trail
- ✅ **Server Actions** - Client-safe wrappers for services

#### **3. Frontend UI**
- ✅ **Revisions Dashboard** (`/founder/revisions`)
  - List all revisions with status filtering
  - Stats overview (Total, Pending, Applied, Draft)
  - Empty states
- ✅ **War Room** (`/founder/revisions/[id]`)
  - Impact analysis with severity badges
  - Strategic resolution modal
  - Resolution types (REWORK, MATERIAL_RETURN, FREE_JOINT, TECHNICAL_EXCEPTION, CLIENT_APPROVAL)
- ✅ **Vanilla CSS Styling** - Glassmorphism, industrial aesthetic
- ✅ **Dashboard Integration** - Navigation card in Founder dashboard

#### **4. Philosophy Implemented**
- ✅ **"No toda revisión genera impactos"** - Conditional impact detection
- ✅ **Event Sourcing** - Full audit trail for compliance
- ✅ **Strategic Resolutions** - Business-driven conflict resolution
- ✅ **Severity Classification** - LOW → CRITICAL based on production level

### 🚧 Próximas Fases

- [x] **Phase 2**: Revision System ✅ **COMPLETE**
- [ ] **Phase 3**: Field Execution Modules (Real production tracking)
- [ ] **Phase 4**: Offline-First PWA (Spools, QA, Logistics)
- [ ] **Phase 5**: Professional Community (Job Board)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Vanilla CSS (CSS Variables)
- **PWA**: `@ducanh2912/next-pwa` (para apps de terreno)

### Backend
- **BaaS**: Supabase
  - Auth (autenticación)
  - PostgreSQL (base de datos)
  - Row Level Security (RLS)
  - Realtime (sincronización)

### Infraestructura
- **Hosting**: Vercel (múltiples proyectos)
- **Repositorio**: GitHub (monorepo)
- **Versionamiento**: Git

---

## 📁 Estructura del Proyecto

### Actual (Fase 1)
```
LukeAPP/
├── src/
│   ├── app/
│   │   ├── (lobby)/           # Grupo de rutas del lobby
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── login/         # Login
│   │   │   ├── register/      # Registro
│   │   │   └── lobby/         # Selector de contexto
│   │   ├── layout.tsx         # Layout raíz
│   │   └── globals.css        # Estilos globales
│   ├── components/
│   │   └── LogoutButton.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts      # Cliente browser
│   │       ├── server.ts      # Cliente server
│   │       └── middleware.ts  # Middleware auth
│   └── styles/
│       └── design-system.css  # Variables CSS
├── supabase/
│   └── migrations/
│       └── 0000_initial_schema.sql
├── .env.local                 # Variables de entorno (gitignored)
├── env.example                # Ejemplo de variables
└── package.json
```

### Futura (Monorepo)
```
LukeAPP/
├── apps/
│   ├── web-core/              # App actual (Fase 1)
│   ├── field-spool/           # Nueva app terreno
│   ├── field-qa/              # Nueva app terreno
│   └── field-logistics/       # Nueva app terreno
├── packages/
│   ├── domain/                # Tipos y modelos compartidos
│   ├── sync-engine/           # Lógica de sincronización
│   └── ui/                    # Componentes compartidos
└── supabase/                  # Schema compartido
```

---

## 🎨 Tech Stack & Styling Guidelines (CRÍTICO)

> [!IMPORTANT]  
> **Este proyecto utiliza 100% Vanilla CSS.**
> **Tailwind CSS NO está instalado y NO debe usarse.**

### ¿Por qué Vanilla CSS?
Para mantener control total sobre nuestro "Industrial Glassmorphism" y animaciones complejas sin luchar contra la especificidad de utilidades o configuraciones de purga.

### Reglas de Estilo
1.  **Estilos Globales**: Definidos en `src/app/globals.css`.
2.  **Design Tokens**: Variables CSS (colores, espacios, blur) centralizadas en `src/styles/design-system.css`.
3.  **Utilidades de Layout**: Usar clases semánticas reales como `.auth-stack`, `.auth-header`, `.landing-hero` definidas en CSS estricto.
4.  **Sin "Fake" Classes**: No escribir `flex`, `gap-4`, `w-full` directamente en JSX a menos que hayas verificado personalmente que existen en `globals.css`.

### Workflow de Contribución
- **Agregar Estilos**: Crear una clase BEM-like en `globals.css` (ej: `.my-component__element`) y aplicarla en JSX.
- **Prohibido instalar Tailwind**: Cualquier intento de introducir Tailwind será rechazado para preservar la consistencia arquitectónica.

---

## 🎨 Principios de Diseño

### 1. Separación Online vs Offline (CRÍTICA)

**Mundo Online (Web Core):**
- Lobby, landing, administración
- 100% online
- Stateless
- Next.js tradicional

**Mundo Offline (Field Apps):**
- Operación en terreno
- Offline-first real
- PWA con service workers
- Sincronización eventual
- **Las Field Apps pueden ejecutarse en móviles, tablets o laptops de terreno**

> ⚠️ **Nunca compartir lógica de ejecución entre mundos.**

### 2. Offline-First Real (No Simulación)

Las apps de terreno deben:
- ✅ Funcionar con 0 señal
- ✅ Guardar toda acción localmente
- ✅ Sincronizar cuando haya conexión
- ✅ Nunca bloquear al usuario por red

### 3. Event-Based Thinking

- Las apps de terreno **emiten eventos**
- No mutan estado global directamente
- Sincronización basada en eventos ordenados
- Eventual consistency aceptada
- **El estado visible en la UI es una proyección derivada de eventos, no una fuente de verdad**

### 4. Lobby Obligatorio

- Ningún usuario accede a features operativas sin pasar por el Lobby
- Contexto (empresa + proyecto + rol) debe ser seleccionado explícitamente
- Sin contexto → sin aplicación

### 5. Lobby como Project Hall (Nueva Regla)

El Lobby **NO es un selector libre de proyectos**.

#### Nueva Regla:
- Un usuario **solo puede pertenecer a un proyecto**
- La pertenencia se define **exclusivamente por invitación**
- El Lobby existe para:
  - Confirmar contexto
  - Mostrar rol y empresa
  - Servir como punto de transición

#### Estados del Lobby:
- **Usuario sin membresía**:
  - Se muestra estado "Empty Lobby"
  - CTA para contacto o completar perfil
- **Usuario con membresía activa**:
  - Se carga automáticamente el proyecto asignado
  - No hay elección manual

> Sin invitación → no hay proyecto → no hay aplicación.

### 6. Roles Scoped

- Los roles siempre están asociados a un proyecto
- Nunca tratar roles como permisos globales
- Un usuario puede tener múltiples roles en múltiples proyectos

### 7. Multi-Tenant por Diseño

- Toda solución debe escalar a múltiples empresas, proyectos y equipos
- Cualquier solución que no escale es inválida
- **Backend como árbitro final**: Los eventos no actualizan tablas de negocio directamente; primero son validados y procesados por el motor de sincronización

### 8. Lenguaje Técnico

| Capa | Idioma |
|------|--------|
| Base de datos | Inglés |
| Tablas/Columnas | Inglés |
| Funciones/APIs | Inglés |
| Código | Inglés |
| UI/Labels | Español |

---

## 🗺️ Roadmap

### ✅ Fase 1: Lobby & Identity (Completada)
- Sistema de autenticación
- Selector de contexto
- Schema multi-tenant
- Fundación del proyecto

### 🔄 Fase 2: Ingeniería y Carga de Datos (Próxima)

**Objetivo**: Permitir que Oficina Técnica cargue la información de ingeniería que luego consumirán las apps de terreno.

> **⚠️ Nota Arquitectónica Crítica**:  
> Antes de desarrollar cualquier app de terreno, se debe definir el **Event Contract oficial** del sistema (schemas de eventos, validaciones y versionado). Esto evita que alguien empiece por UI o tablas.

**Submódulos**:

#### 2A: Carga de Datos de Ingeniería
- Importación de Excel/CSV (isométricos, spools, welds)
- Validación y preview de datos
- Gestión de planos y documentos
- Parser de datos de ingeniería

#### 2B: Gestión de Revisiones
- Anuncio de nuevas revisiones (Rev A → Rev B)
- Comparación automática de cambios
- Análisis de impacto en spools existentes
- Aprobación y migración de datos

#### 2C: Motor de Sincronización
- Configuración de Dexie (IndexedDB)
- Lógica de sincronización offline
- Cola de reintentos
- Preparación de snapshots para apps de terreno

**Tecnologías a integrar**:
- `dexie` + `dexie-react-hooks` (Offline DB)
- `xlsx` (Excel import/export)
- `papaparse` (CSV parsing)
- `@react-pdf/renderer` (PDF generation)
- `zustand` (State management)

**Ver**: [`PIPING_ANALYSIS.md`](file:///c:/Github/LukeAPP/PIPING_ANALYSIS.md) para análisis completo del código anterior reutilizable.

---

### 📦 Fase 3: Módulos de Terreno (Después de Fase 2)
- App Spools (Fabricación)
- App QA (Control de calidad)
- App Logística (Movimientos)
- Sincronización offline real

### 👥 Fase 4: Comunidad Profesional
- Perfiles profesionales
- Bolsa de trabajo
- Sistema de invitaciones

---

## 💻 Desarrollo

### Requisitos Previos

- Node.js 18+
- npm
- Cuenta Supabase

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/Crisvalpo/LukeAPPv3.git
cd LukeAPPv3

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=tu-proyecto-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### Ejecutar Migración SQL

#### Método 1: Manual (SQL Editor)

1. Ve a tu proyecto Supabase
2. Abre el SQL Editor
3. Copia y pega `supabase/migrations/0000_initial_schema.sql`
4. Ejecuta el script

#### Método 2: Programático (Recomendado)

Para ejecutar migraciones desde código (útil para automatización):

1. **Generar Access Token:**
   - Ve a https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Nombre: "Migration Script"
   - Copia el token generado

2. **Ejecutar migración:**

```bash
# Crear script (ya existe en scripts/execute_sql_direct.js)
node scripts/execute_sql_direct.js
```

**Plantilla del script:**

```javascript
const SUPABASE_ACCESS_TOKEN = 'sbp_your_token_here'
const PROJECT_REF = 'your_project_ref'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `/* Tu SQL aquí */`

async function executeSQLDirect() {
    const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    })
    
    if (!response.ok) throw new Error(await response.text())
    console.log('✅ SQL ejecutado')
}

executeSQLDirect()
```

**Ventajas:**
- ✅ Automatizable en CI/CD
- ✅ Versionable en Git
- ✅ Ejecutable desde terminal
- ✅ No requiere abrir navegador

### Desarrollo Local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Build de Producción

```bash
npm run build
npm start
```

---

## 📚 Documentación Adicional

- **Workflow Rules**: `.agent/workflows/lukeapp.md`
- **Walkthrough Fase 1**: Ver artifacts en `.gemini/antigravity/brain/`
- **Schema SQL**: `supabase/migrations/0000_initial_schema.sql`

---

## 🤝 Contribución

Este es un proyecto privado en desarrollo activo. Para contribuir:

1. Leer completamente este README
2. Revisar `.agent/workflows/lukeapp.md`
3. Respetar los principios de arquitectura
4. Nunca mezclar mundos Online/Offline

---

## 📄 Licencia

Privado - Todos los derechos reservados

---

**Última actualización**: Fase 1 completada - 25/12/2025

---

## 👁️ Reglas Base de Vistas (Derived UI)

> **Objetivo**: No “diseñar pantallas”, sino derivar vistas automáticamente desde el dominio y el rol.

### 1. Principio Maestro: "Derive, Don't Design"
Una vista solo existe si responde a uno de estos 4 propósitos:
- **Ver estado** (tabla / kanban / resumen)
- **Actuar** (crear / editar / asignar)
- **Supervisar** (KPI, alertas)
- **Contextualizar** (Lobby, Hall)

🚫 Si no cumple uno de esos propósitos, no se crea.

### 2. Tipos Canónicos de Vistas (Estrictamente 5)

| Tipo | Equivalente | Uso | Reglas |
|------|-------------|-----|--------|
| **📋 ListView** | Table View | Listar entidades (Personal, Spools) | Siempre lleva Búsqueda + Filtros (Negocio) + Acciones Inline. |
| **🧩 CardView** | Kanban | Operaciones diarias (Estado > Dato) | Estados definidos por dominio. Drag-and-drop si aplica. |
| **📝 FormView** | Form | Crear/Editar UNA entidad | Generado desde metadata. Create/Edit comparten componente. |
| **📊 DashboardView** | Dashboard | KPIs, Supervisión (Staff/Líderes) | Read-only. Drill-down. Bloques reutilizables. NO CRUD. |
| **🏛️ ContextView** | Lobby | Ubicar al usuario en contexto | No es navegación, es confirmación. |

### 3. Regla de Oro (Anti-Caos)
❌ **Nunca crear vistas “especiales”.**  
Si surge un caso borde, se resuelve con: **Filtro**, **Estado**, **Rol** o **Variante del Layout**. Nunca con una `SpecialView.tsx`.

### 4. Una Vista = Un Rol Primario
Cada vista define explícitamente `allowedRoles: ['SUPERVISOR']`. Si un rol no tiene vistas asignadas, no opera.

### 5. Generación de Vistas (Reglas Operativas)

Las vistas **no se crean manualmente**.

Se derivan desde:
- Dominio (Entidad + Estado)
- Rol Funcional
- Tipo Canónico de Vista

#### Regla:
> Si una entidad existe en el dominio,
> su representación visual **ya está definida por convención**.

#### Ejemplo:
- Entidad: `spools`
- Estado dominante: `status`
- Operación principal: seguimiento de avance

→ Vista resultante:
- `CardView` (kanban)
- Filtros por estado
- Acciones derivadas desde permisos

#### Prohibiciones:
- ❌ Vistas “a pedido”
- ❌ Formularios únicos por rol
- ❌ Dashboards que mezclen CRUD con KPIs

Si una vista parece necesitar lógica especial,
el error está en:
- El dominio
- Los permisos
- O el estado
**Nunca en la vista.**

