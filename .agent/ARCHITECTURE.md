# Technical Architecture: LukeAPP v3

Documentation of the core technical patterns, security layers, and architectural constraints.

---

## 🔐 1. Dual-Layer Identity Model
LukeAPP separates security from user experience to allow for company-specific flexibility without compromising database safety.

### Layer A: System Role (Security)
- **Implementation**: `members.role_id` column.
- **Values**: `super_admin`, `founder`, `admin`, `supervisor`, `worker`.
- **Purpose**: Controls **Row Level Security (RLS)** in Supabase.
- **Visibility**: Never exposed to the UI directly.
- **Rule**: This is the single source of truth for "What data can this user read/write?".

### Layer B: Functional Role (UX / Job Title)
- **Implementation**: `members.functional_role_id` linked to `company_roles`.
- **Values**: "Expeditor", "Jefe de OT", "Capataz", "Pañolero", etc.
- **Purpose**: Controls menu visibility, allowed UI actions, and dashboard routing.
- **Visibility**: Displayed with colors and icons in the Lobby and Professional Profile.

---

## 🎨 2. Styling & Design (Tailwind CSS v4)
The platform is standardizing on **Tailwind CSS v4** for all new development and gradual refactoring.

### Core Standards
- **Standard**: Tailwind CSS v4 is the primary tool for layout (flex, grid), spacing, and transitions.
- **Token Source**: `src/styles/design-system.css` contains the authoritative CSS variables for colors, radii, and shadows.
- **Rule**: Do not hardcode hex/colors. Use `bg-brand-primary` or `var(--color-*)`.
- **Design Pattern**: **Derived UI**. Follow the 5 canonical view types (`ListView`, `CardView`, `FormView`, `DashboardView`, `ContextView`).

### Style Guide Laboratory
Visit `/staff/styleguide` (in local development) to see the live implementation of:
- **Icons**: Centralized mapping in `src/components/ui/Icons.ts` (Lucide-based).
- **Typography**: Enforced via `src/components/ui/Typography.tsx`.
- **Components**: Standard implementations of `Badge`, `Button`, `Card`, `InputField`, etc.

---

## 🌐 3. Connectivity & Satellite Architecture
LukeAPP operates across two different execution environments.

### Web Core (lukeapp.me)
- **Tech Stack**: Next.js (App Router) + Tailwind + Design System variables.
- **Environment**: Online required. Runs on Ubuntu Server.
- **Users**: Admin, Engineering, Management, Founders.

### Field Satellites (field.lukeapp.me, etc.)
- **Tech Stack**: Next.js PWA + Tailwind (Mobile First).
- **Environment**: **Offline-First**. Uses Service Workers and IndexedDB (via local sync logic).
- **Users**: Workers, Supervisors, Quality Inspectors.
- **Communication**: Field apps emit **Events**. Web Core proceses these events to update the central state.

---

## 🏛️ 4. Data Access Rules (RLS)
Security is enforced at the database layer using Postgres RLS policies.

- **Bypass Rule**: `super_admin` has a general bypass for oversight.
- **Tenant Isolation**: All queries must include `company_id`.
- **Project Isolation**: Operational roles (`admin`, `supervisor`, `worker`) are strictly scoped to a `project_id`.
- **Recursion Guard**: Use `SECURITY DEFINER` functions (e.g., `is_super_admin()`) to check roles in policies, preventing infinite loops.

---

## 🏷️ 5. Technical Nomenclature & Language
- **Database/Code**: Everything must be in **English** (Tables, columns, functions, variables).
- **Labels/UI**: Everything facing the user must be in **Spanish**.

| Category | Example |
|---|---|
| Postgres Table | `material_catalog` |
| Variable Name | `isInvitationValid` |
| UI Label | `Guardar Cambios` |

---
