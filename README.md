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

### ✅ Fase 1: Lobby, Identity & Access (COMPLETADA)

**Implementado:**
- [x] Next.js 16 App Router con TypeScript
- [x] Sistema de diseño Vanilla CSS (Glassmorphism)
- [x] Integración Supabase (Auth + DB)
- [x] Schema multi-tenant (profiles, companies, projects, roles, members)
- [x] Flujo de autenticación (Login/Register/Lobby)
- [x] Selector de contexto
- [x] Políticas RLS para seguridad de datos
- [x] Fundación offline-first

**Verificado:**
- ✅ Registro de usuarios funcional
- ✅ Redirección automática al lobby
- ✅ Sesión persistente
- ✅ Conexión Supabase operativa

### 🚧 Próximas Fases

- [ ] **Fase 2**: Arquitectura Offline-First
- [ ] **Fase 3**: Módulos de Terreno (Spools, QA, Logística)
- [ ] **Fase 4**: Comunidad Profesional

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

### 4. Lobby Obligatorio

- Ningún usuario accede a features operativas sin pasar por el Lobby
- Contexto (empresa + proyecto + rol) debe ser seleccionado explícitamente
- Sin contexto → sin aplicación

### 5. Roles Scoped

- Los roles siempre están asociados a un proyecto
- Nunca tratar roles como permisos globales
- Un usuario puede tener múltiples roles en múltiples proyectos

### 6. Multi-Tenant por Diseño

- Toda solución debe escalar a múltiples empresas, proyectos y equipos
- Cualquier solución que no escale es inválida
- Backend como árbitro final

### 7. Lenguaje Técnico

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

1. Ve a tu proyecto Supabase
2. Abre el SQL Editor
3. Copia y pega `supabase/migrations/0000_initial_schema.sql`
4. Ejecuta el script

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

**Última actualización**: Fase 1 completada - 23/12/2025
