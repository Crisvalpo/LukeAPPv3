# LukeAPP v3

**Multi-tenant Industrial Piping Management Platform**

[![Repository](https://img.shields.io/badge/repo-Crisvalpo%2FLukeAPPv3-blue)](https://github.com/Crisvalpo/LukeAPPv3)
[![Phase](https://img.shields.io/badge/phase-1.5%20active-blue)](https://github.com/Crisvalpo/LukeAPPv3)

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Arquitectura de Identidad](#-arquitectura-de-identidad-crítico)
- [Principios de Arquitectura](#-principios-de-arquitectura)
- [🗺️ Roadmap & Progreso](#-roadmap--progreso)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Reglas de UI (Derived Design)](#-reglas-de-ui-derived-design)
- [Guías de Desarrollo](#-guías-de-desarrollo)

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

---

## 🏗️ Arquitectura de Identidad (CRÍTICO)

LukeAPP implementa un modelo de identidad de **doble capa**, diseñado para separar seguridad, función y experiencia de usuario.

### Layer A: System Role (Security Layer)
- Controla **Row Level Security (RLS)** en Supabase.
- Valores estrictos: `admin` (Staff), `supervisor`, `worker`, `founder`.
- **No define UX ni vistas**.
- Es la única fuente de verdad para el acceso a datos.

### Layer B: Functional Role (UX Layer)
- Definido por la empresa (ej: `Pañolero`, `Jefe de Calidad`, `Capataz`).
- Controla:
  - Vistas visibles en el menú.
  - Acciones permitidas en la interfaz.
  - Dashboard inicial.
- **Es opcional**: Si no existe, el usuario opera con funcionalidad genérica según su System Role.

### Políticas de Cuenta (Strict 1:1 Rule)

Para garantizar la seguridad y evitar cuentas compartidas:

#### 1. Founders (1 Cuenta = 1 Empresa)
- Un usuario `founder` **solo puede gestionar una empresa**.
- Para gestionar otra, debe usar otro email.

#### 2. Staff Operativo (1 Cuenta = 1 Proyecto)
- Usuarios con roles operativos (`admin`, `supervisor`, `worker`) **solo pueden pertenecer a un proyecto activo a la vez**.
- **Protocolo de Movimiento**: Para mover a un admin del Proyecto A al B, primero debe ser desvinculado del A.

---

## 🏗️ Principios de Arquitectura

### 1. Separación Online vs Offline (CRÍTICA)

| App | Tipo | Conectividad | Tecnología |
|-----|------|--------------|------------|
| **Web Core** | Gestión / Admin | 100% Online | Next.js (SSR/CSR) |
| **Field Apps** | Operación Terreno | 100% Offline-First | PWA + Service Workers |

> ⚠️ **Regla de Oro**: Nunca compartir lógica de ejecución entre mundos. Las Field Apps deben poder operar días enteros sin internet.

### 2. Event-Based Thinking
- Las apps de terreno **emiten eventos** (ej: `SPOOL_WELDED`).
- No mutan el estado global directamente.
- El backend procesa la cola de eventos y actualiza la "Verdad Central".
- La UI muestra una **proyección** de estos eventos.

### 3. Lobby Obligatorio
- Ningún usuario accede a features operativas sin pasar por el Lobby.
- El Lobby **no es un selector libre**: confirma el contexto asignado.
- Sin invitación → No hay proyecto → No hay aplicación.

---

## 🗺️ Roadmap & Progreso

Ordenado por etapas lógicas de construcción del producto.

### ✅ Fase 1: Foundation & Identity (Core)
*Base sólida, multi-tenant y manejo de usuarios.*
- [x] **Infraestructura**: Next.js 15, Supabase Auth/RLS, Vanilla CSS.
- [x] **Multi-tenant**: CRUD de Empresas y Proyectos.
- [x] **Invitaciones**: Link-based invites (Staff → Founder → Admin).
- [x] **Dashboarding**: Vistas específicas para Staff, Founder y Admin.
- [x] **Roles Dinámicos**: Sistema de roles funcionales customizables.
- [x] **Onboarding**: Flujo de bienvenida y carga de logo corporativo.

### ✅ Fase 2: Engineering & Revisions (Data)
*El corazón de la información técnica.*
- [x] **Smart Revisions**: Gestión de eventos de revisión (Event Sourcing).
- [x] **Impact Analysis**: Detección automática de conflictos (Spools/Welds).
- [x] **War Room**: Resolución estratégica de conflictos (Rework, Returns).
- [x] **Weld Types Config**: Configuración de tipos de unión (BW, SW, Threaded) por proyecto.

### 🔄 Fase 3: Procurement & Materials (Activo)
*Gestión de materiales y catálogo.*
- [x] **Material Catalog**: Tabla maestra de items con filtros inteligentes.
- [x] **Uploaders**: Carga masiva desde Excel con validación.
- [ ] **Material Requests**: Solicitudes de material a bodega.
- [ ] **Stock Control**: Inventario básico.

### 🔄 Fase 4: Visualization & Modeling (Activo)
*Representación visual del estado del proyecto.*
- [x] **3D Viewer Core**: Integración de visor isométrico.
- [x] **Spool Mapping**: Mapeo de datos DB sobre modelos 3D.
- [ ] **Visual Status**: Coloreado de modelos según estado (Soldado, Pintado, etc).

### 🚧 Fase 5: Field Execution (Offline-First)
*Aplicaciones satélite para trabajo en terreno.*
- [ ] **Spool Tracking PWA**: Control de avance de fabricación.
- [ ] **QA/QC PWA**: Reportes de calidad y liberación.
- [ ] **Logistics PWA**: Recepción y despacho de materiales.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Vanilla CSS (CSS Variables) - **NO Tailwind**.
- **PWA**: `@ducanh2912/next-pwa`

### Backend
- **BaaS**: Supabase (Auth, Postgres, RLS, Realtime, Edge Functions).

### Infraestructura
- **Deploys**: Vercel (Proyectos separados para Web Core vs Field Apps).

---

## 📁 Estructura del Proyecto

```bash
LukeAPP/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Rutas autenticadas (Founder, Staff, Admin)
│   │   ├── (lobby)/           # Rutas públicas y selección de contexto
│   │   ├── api/               # API Routes (auth, etc)
│   │   ├── invitations/       # Landing de invitaciones
│   │   └── ...
│   ├── components/
│   │   ├── engineering/       # Componentes de ingeniería
│   │   ├── procurement/       # Gestión de materiales
│   │   ├── ui/                # UI Kit (Buttons, Cards, Inputs, Icons)
│   │   └── ...
│   ├── services/              # Lógica de negocio (Client-safe wrappers)
│   │   ├── material-catalog.ts
│   │   ├── revisions.ts
│   │   └── ...
│   ├── styles/
│   │   └── design-system.css  # Variables CSS Globales
│   └── types/                 # Definiciones TypeScript
├── supabase/
│   ├── migrations/            # Historial SQL
│   └── functions/             # Edge Functions
└── ...
```

---

## 👁️ Reglas de UI (Derived Design)

> **Objetivo**: No “diseñar pantallas”, sino derivar vistas automáticamente desde el dominio y el rol.

### 1. Principio Maestro: "Derive, Don't Design"
Una vista solo existe si responde a uno de estos 4 propósitos:
- **Ver estado** (tabla / kanban / resumen)
- **Actuar** (crear / editar / asignar)
- **Supervisar** (KPI, alertas)
- **Contextualizar** (Lobby)

### 2. Tipos Canónicos de Vistas

| Tipo | Uso Principal | Componentes Clave |
|------|---------------|-------------------|
| **📋 ListView** | Listar entidades (Spools, Usuarios) | Búsqueda, Filtros, Acciones Inline |
| **🧩 CardView** | Operaciones diarias (Kanban) | Drag & Drop, Badges de Estado |
| **📝 FormView** | Crear/Editar UNA entidad | Inputs Validados, Save/Cancel |
| **📊 DashboardView** | Supervisión (Read-only) | KPIs, Gráficos, Alertas |
| **🏛️ ContextView** | Ubicación (Lobby) | Tarjetas de Proyecto, Info de Rol |

### 3. Style Guide Laboratory
Ubicación: `/staff/styleguide`
Fuente de verdad visual. Contiene todos los componentes base (`Icons`, `Typography`, `Card`, `InputField`). Utilizar siempre estos componentes para mantener la consistencia.

---

## 💻 Guías de Desarrollo

### Setup Local

```bash
git clone https://github.com/Crisvalpo/LukeAPPv3.git
npm install
cp env.example .env.local
# Configurar credenciales Supabase (.env.local)
npm run dev
```

### Migraciones SQL (Método Programático)

Para mantener la consistencia y automatización, preferimos ejecutar SQL vía script en lugar de pegar en la consola web de Supabase.

1. Crear token en Supabase Dashboard > Account > Access Tokens.
2. Ejecutar script:

```bash
node scripts/execute_sql_direct.js
```

*(El script usa la Management API de Supabase para aplicar migraciones sin abrir el navegador)*.

---

## 🔒 Security Guidelines

### Credential Management

**Critical Rule**: Never commit credentials to git.

#### Environment Variables

All sensitive data must be in `.env.local` (already in `.gitignore`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

#### Development Scripts

Scripts that need credentials must read from environment:
```powershell
# ❌ BAD
$url = "https://project.supabase.co"

# ✅ GOOD  
$url = $env:NEXT_PUBLIC_SUPABASE_URL
```

#### Pre-Commit Checklist

Before every commit:
- [ ] No hardcoded URLs in code
- [ ] No API keys in files
- [ ] All `.env*` ignored
- [ ] Development scripts use environment variables

**If credentials are exposed**: Immediately rotate keys in Supabase Dashboard → Settings → API.

---

### Tech & Styling Guidelines

> [!IMPORTANT]  
> **Este proyecto utiliza 100% Vanilla CSS.**
> **Tailwind CSS NO está instalado y NO debe usarse.**

1.  **Estilos Globales**: `src/app/globals.css`.
2.  **Design Tokens**: `src/styles/design-system.css` (Variables CSS).
3.  **Animaciones**: Preferir CSS Transitions nativas para rendimiento.
4.  **Glassmorphism**: Usar variables `--glass-bg`, `--glass-border` para consistencia.

---
**Privado - Todos los derechos reservados © 2026**
