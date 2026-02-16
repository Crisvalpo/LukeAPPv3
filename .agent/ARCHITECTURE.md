# Arquitectura Técnica: LukeAPP v3

Documentación de los patrones técnicos core, capas de seguridad y restricciones arquitectónicas.

---

## 🔐 1. Modelo de Identidad de Doble Capa
LukeAPP separa la seguridad de la experiencia de usuario para permitir flexibilidad específica por empresa sin comprometer la seguridad de la base de datos.

### Capa A: Rol de Sistema (Seguridad)
- **Implementación**: Columna `members.role_id`.
- **Valores**: `super_admin`, `founder`, `admin`, `supervisor`, `worker`.
- **Propósito**: Controla el **Row Level Security (RLS)** en Supabase.
- **Visibilidad**: Nunca se expone directamente a la UI.
- **Regla**: Esta es la única fuente de verdad para "¿Qué datos puede leer/escribir este usuario?".

### Capa B: Rol Funcional (UX / Cargo)
- **Implementación**: Columna `members.functional_role_id` vinculada a `company_roles`.
- **Valores**: "Expedidor", "Jefe de OT", "Capataz", "Pañolero", etc.
- **Propósito**: Controla la visibilidad del menú, acciones permitidas en la UI y el enrutamiento del dashboard.
- **Visibilidad**: Se muestra con colores e iconos en el Lobby y Perfil Profesional.

---

## 🎨 2. Estilo y Diseño (Tailwind CSS v4)
La plataforma se está estandarizando en **Tailwind CSS v4** para todo el nuevo desarrollo y refactorización gradual.

### Estándares Core
- **Estándar**: Tailwind CSS v4 es la herramienta principal para el layout (flex, grid), espaciado y transiciones.
- **Fuente de Tokens**: `src/styles/design-system.css` contiene las variables CSS autoritativas para colores, radios y sombras.
- **Regla**: No hardcodear hex/colores. Usar `bg-brand-primary` o `var(--color-*)`.
- **Patrón de Diseño**: **UI Derivada**. Seguir los 5 tipos de vistas canónicas (`ListView`, `CardView`, `FormView`, `DashboardView`, `ContextView`).

### Laboratorio de Guía de Estilos
Visita `/staff/styleguide` (en desarrollo local) para ver la implementación en vivo de:
- **Iconos**: Mapeo centralizado en `src/components/ui/Icons.ts` (basado en Lucide).
- **Tipografía**: Forzada mediante `src/components/ui/Typography.tsx`.
- **Componentes**: Implementaciones estándar de `Badge`, `Button`, `Card`, `InputField`, etc.

---

## 🌐 3. Conectividad y Arquitectura Satélite
LukeAPP opera a través de dos entornos de ejecución diferentes.

### Web Core (lukeapp.me)
- **Stack Tecnológico**: Next.js (App Router) + Tailwind + variables del Design System.
- **Entorno**: Requiere conexión online. Se ejecuta en Ubuntu Server.
- **Usuarios**: Admin, Ingeniería, Gestión, Founders.

### Satélites de Terreno (field.lukeapp.me, etc.)
- **Stack Tecnológico**: Next.js PWA + Tailwind (Mobile First).
- **Entorno**: **Offline-First**. Utiliza Service Workers e IndexedDB (vía lógica de sincronización local).
- **Usuarios**: Trabajadores, Supervisores, Inspectores de Calidad.
- **Comunicación**: Las apps de terreno emiten **Eventos**. El Web Core procesa estos eventos para actualizar el estado central.

---

## 🏛️ 4. Reglas de Acceso a Datos (RLS)
La seguridad se impone en la capa de la base de datos mediante políticas RLS de Postgres.

- **Regla de Bypass**: `super_admin` tiene un bypass general para supervisión.
- **Aislamiento de Inquilino (Tenant)**: Todas las consultas deben incluir `company_id`.
- **Aislamiento de Proyecto**: Los roles operativos (`admin`, `supervisor`, `worker`) están estrictamente limitados a un `project_id`.
- **Protección contra Recursión**: Usar funciones `SECURITY DEFINER` (ej: `is_super_admin()`) para verificar roles en las políticas, evitando bucles infinitos.

---

## 🏷️ 5. Nomenclatura Técnica e Idioma
- **Base de Datos/Código**: Todo debe estar en **Inglés** (Tablas, columnas, funciones, variables).
- **Etiquetas/UI**: Todo lo que vea el usuario debe estar en **Español**.

| Categoría | Ejemplo |
|---|---|
| Tabla Postgres | `material_catalog` |
| Nombre de Variable | `isInvitationValid` |
| Etiqueta UI | `Guardar Cambios` |

---
