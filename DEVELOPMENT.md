# Development Guide - LukeAPP v3

This guide provides developers with the information needed to work effectively on the LukeAPP codebase.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Code Organization](#code-organization)
- [Coding Standards](#coding-standards)
- [Database & Migrations](#database--migrations)
- [Testing Strategy](#testing-strategy)
- [Common Patterns](#common-patterns)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for development)
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/Crisvalpo/LukeAPPv3.git
cd LukeAPPv3

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

Required variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

For SQL migrations (optional):
```env
SUPABASE_ACCESS_TOKEN=your_access_token
PROJECT_REF=your_project_ref
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard layout group
│   │   ├── staff/         # Super Admin pages
│   │   ├── founder/       # Founder pages
│   │   ├── admin/         # Admin pages (future)
│   │   └── layout.tsx     # Shared dashboard layout
│   ├── invitations/       # Public invitation acceptance
│   └── page.tsx           # Landing page
│
├── components/            # React components
│   ├── layout/           # Layout components (Sidebar, Header)
│   └── ui/               # Reusable UI components (future)
│
├── services/             # Business logic & API calls
│   ├── companies.ts      # Companies CRUD
│   ├── projects.ts       # Projects CRUD
│   ├── invitations.ts    # Invitations logic
│   └── staff.ts          # Staff dashboard stats
│
├── lib/                  # Utilities & configurations
│   └── supabase/        # Supabase client & middleware
│
├── types/               # TypeScript type definitions
│   └── index.ts         # Centralized types
│
├── constants/           # Application constants
│   └── index.ts         # Enums, routes, validation
│
└── styles/              # CSS files (Legacy Vanilla CSS + Tailwind)
    ├── globals.css      # Global styles & CSS variables (legacy)
    ├── dashboard.css    # Dashboard common styles (legacy)
    ├── companies.css    # Companies specific (legacy)
    ├── invitations.css  # Invitations specific (legacy)
    └── ...              # Migrating gradually to Tailwind

supabase/
└── migrations/          # Database migrations (SQL)
    ├── 0001_initial_schema.sql
    ├── 0002_rls_policies.sql
    └── ...

scripts/                 # Utility scripts
└── apply_*.js          # Migration application scripts
```

---

## 🏗️ Code Organization

### Service Layer Pattern

All business logic lives in `src/services/`. Components should **never** query Supabase directly.

**Example:**

```typescript
// ❌ BAD - Component querying DB
export default function ProjectsList() {
    const supabase = createClient()
    const { data } = await supabase.from('projects').select('*')
    // ...
}

// ✅ GOOD - Using service layer
import { getProjectsByCompany } from '@/services/projects'

export default function ProjectsList() {
    const projects = await getProjectsByCompany(companyId)
    // ...
}
```

### Type Safety

Always use types from `src/types/index.ts`:

```typescript
import { Project, ProjectWithStats, CreateProjectParams } from '@/types'

function createProject(params: CreateProjectParams): ApiResponse<Project> {
    // Type-safe implementation
}
```

### Routes & Navigation

Use constants from `src/constants/`:

```typescript
import { ROUTES } from '@/constants'

// ❌ BAD
router.push(`/founder/projects/${id}`)

// ✅ GOOD
router.push(ROUTES.FOUNDER_PROJECT_DETAIL(id))
```

---

## 📐 Coding Standards

### Language Rules (CRITICAL)

| Layer | Language |
|-------|----------|
| Database (tables, columns) | **English** |
| Functions, APIs, Code | **English** |
| UI text, labels | **Spanish** |

**Example:**

```typescript
// ✅ GOOD
const projectData = await getProjectsByCompany(companyId)
return <h1>Mis Proyectos</h1>

// ❌ BAD
const datosProyecto = await obtenerProyectosPorEmpresa(idEmpresa)
return <h1>My Projects</h1>
```

### Styling Rules

**Tailwind CSS (Migración Gradual)** - Preferir Tailwind para nuevos componentes

```typescript
// ✅ GOOD (Nuevo código - Tailwind)
<div className="flex items-center gap-4">

// ⚠️ LEGACY (Código existente - Vanilla CSS)
<div className="company-header-content">
// Migrar gradualmente a Tailwind cuando se modifique
```

### 🎨 Design System & UI Standards (STRICT)

**Consistency is King.** The application must look and feel like a single cohesive product. DO NOT introduce new styles unless absolutely necessary.

#### 1. Styling Approach (Tailwind Migration)
- **New Components**: Use Tailwind CSS utilities.
- **Legacy Components**: May still use classes from `src/styles/dashboard.css`, `companies.css`, etc.
- **Migration Strategy**: When modifying legacy components, gradually refactor to Tailwind.

#### 2. Legacy Core Styles (`dashboard.css`) - ⚠️ Being Phased Out
Some dashboard pages still use classes from `src/styles/dashboard.css`:
- **Layout**: `.dashboard-page`, `.dashboard-header` (migrate to Tailwind flex/grid)
- **Forms**: `.company-form`, `.form-field`, `.form-label`, `.form-input` (migrate to Tailwind form utilities)
- **Buttons**: `.form-button`, `.action-button` (migrate to Tailwind button classes)

#### 3. Component Consistency
- **Buttons**: Main actions are always on the right or bottom. Primary = Purple/Blue gradient. Secondary = Ghost/Glass.
- **Inputs**: All text inputs must have consistent height, padding, and background (use Tailwind utilities).
- **Cards**: Use glassmorphism styling consistently (Tailwind backdrop-blur + bg-opacity).

#### 4. New Features Guidelines
When building new features:
- ✅ **USE** Tailwind CSS utilities for all new code.
- ⚠️ **LEGACY** components may reference `dashboard.css` - refactor when touched.
- ❌ **DO NOT** create new Vanilla CSS files.

### Naming Conventions

```typescript
// Components: PascalCase
export default function CompanyDetailPage() {}

// Functions: camelCase
async function loadCompanyData() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_PAGE_SIZE = 100

// CSS Classes: kebab-case
.company-header-content {}
```

---

## 🗄️ Database & Migrations

### Migration Workflow

1. **Create SQL file:**
   ```
   supabase/migrations/XXXX_description.sql
   ```

2. **Write migration:**
   ```sql
   -- Add RLS policy
   CREATE POLICY "policy_name" ON public.table_name
   FOR SELECT USING (...)
   ```

3. **Apply migration:**
   - **Manual:** Copy SQL → Supabase SQL Editor → Run
   - **Programmatic:** Create `scripts/apply_XXXX.js` → `node scripts/apply_XXXX.js`

### RLS Policy Pattern

All tables must have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Super admins: full access
CREATE POLICY "Super admins full access"
ON public.table_name FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid()
        AND members.role_id = 'super_admin'
    )
);

-- Founders: company-scoped access
CREATE POLICY "Founders company access"
ON public.table_name FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.members
        WHERE user_id = auth.uid()
        AND role_id = 'founder'
    )
);

### ⚠️ RLS Recursion (CRITICAL)

When defining policies for the `members` table (which defines the roles themselves), you **CANNOT** query the `members` table directly in the policy, as this causes **infinite recursion**.

**Incorrect:**
```sql
-- ❌ Infinite Loop on 'members' table
CREATE POLICY "Check role" ON members
USING (EXISTS (SELECT 1 FROM members WHERE ...))
```

**Correct Solution:**
Use a `SECURITY DEFINER` function to break the recursion.

```sql
-- 1. Create function
CREATE FUNCTION is_super_admin() RETURNS boolean 
SECURITY DEFINER 
SET search_path = public
AS $$ 
  SELECT EXISTS(SELECT 1 FROM members WHERE user_id = auth.uid() AND role_id = 'super_admin'); 
$$ LANGUAGE sql;

-- 2. Use in policy
CREATE POLICY "Check role" ON members
USING ( is_super_admin() );
```
```

---

## 🧪 Testing Strategy

### Current State
- No automated tests yet
- Manual testing workflow

### Future Implementation
```typescript
// src/services/__tests__/projects.test.ts
describe('createProject', () => {
    it('validates unique code per company', async () => {
        // Test implementation
    })
})
```

---

## 🔄 Common Patterns

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(true)

if (isLoading) {
    return <div className="dashboard-page">
        <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
    </div>
}
```

### Error Handling

```typescript
const [error, setError] = useState('')

if (error) {
    return <div style={{ 
        padding: '1rem', 
        background: 'rgba(239, 68, 68, 0.1)', 
        border: '1px solid rgba(239, 68, 68, 0.3)', 
        borderRadius: '0.5rem', 
        color: '#f87171' 
    }}>
        {error}
    </div>
}
```

### Form Submission

```typescript
async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = await serviceFunction(formData)

    if (result.success) {
        // Handle success
        router.push(ROUTES.SUCCESS_PAGE)
    } else {
        setError(result.message)
    }

    setIsSubmitting(false)
}
```

### Getting User Company/Project

```typescript
async function loadContext() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        router.push(ROUTES.HOME)
        return
    }

    const { data: memberData } = await supabase
        .from('members')
        .select('company_id, project_id')
        .eq('user_id', user.id)
        .eq('role_id', 'founder') // or 'admin'
        .single()

    if (!memberData) {
        router.push(ROUTES.HOME)
        return
    }

    setCompanyId(memberData.company_id)
}
```

---

### User Architecture
User profiles are stored in `public.users` (not `auth.users` directly).
- **Trigger**: `on_auth_user_created` automatically creates a record in `public.users` when a user signs up.
- **Source of Truth**: Always query `public.users` for profile info (name, avatar), never `auth.users`.
- **Memberships**: `public.members` links `public.users` to companies/projects.

---

## 🧑‍🚧 Identity & Roles Pattern (CRITICAL)

### Dual-Layer Identity Model

LukeAPP implements a **two-layer identity system** to separate security from UX:

#### Layer A: System Role (Security)
```typescript
type SystemRole = 'admin' | 'supervisor' | 'worker'
```
- **Purpose**: Controls Row Level Security (RLS) in Supabase
- **Scope**: Database access control
- **Mutability**: Fixed, never exposed to UI
- **Usage**: `members.role_id` column

#### Layer B: Functional Role (UX/Job Title)
```typescript
interface Member {
  role_id: SystemRole        // Security layer
  job_title?: string         // Optional display label
  functional_role_id?: uuid  // Future: Reference to company_roles table
}
```
- **Purpose**: Defines user's job/function within the company
- **Scope**: UI routing, feature visibility, display labels
- **Mutability**: Customizable per company
- **Examples**: "Pañolero", "Jefe de Calidad", "Capataz"

### Implementation Pattern

**When Creating Invitations:**
```typescript
await createInvitation({
  email: 'user@example.com',
  role_id: 'worker',              // System role (security)
  job_title: 'Pañolero',          // Display label (UX)
  company_id: '...',
  project_id: '...'
})
```

**When Checking Permissions (RLS):**
```sql
-- Use role_id for security checks
WHERE role_id IN ('admin', 'supervisor')
```

**When Displaying to User:**
```tsx
<Badge>{member.job_title || ROLE_LABELS[member.role_id]}</Badge>
```

### Dynamic Functional Roles System (IMPLEMENTED ✅)

**Status:** Phase 1 Complete (70% - Database, Services, UI)

#### Overview
LukeAPP uses a **dual-layer identity model**:
- **System Role** (Security): Fixed roles (`admin`, `supervisor`, `worker`) for RLS
- **Functional Role** (UX): Company-defined roles (e.g., "Jefe de Calidad", "Pañolero") for modules and permissions

#### Database Schema
```sql
-- Main table
company_roles (
  id, company_id, name, description, color,
  base_role,      -- Maps to system role
  permissions,    -- JSONB: modules + resources
  is_template     -- System-provided roles
)

-- Integration
members.functional_role_id → company_roles.id
invitations.functional_role_id → company_roles.id
```

#### Permissions Structure
```typescript
{
  modules: {
    quality: { enabled: true, is_home: true },
    field: { enabled: true, is_home: false }
  },
  resources: {
    joints: { view: true, inspect: true, approve: true },
    test_packs: { view: true, create: true }
  }
}
```

#### Standard Roles (14 Templates)
- **Management:** Gerencia, Cliente/ITO, P&C
- **Engineering:** Jefe OT, Control Document, Secretarios (2)
- **Field:** Supervisor, QA, Jefe Taller, Logística
- **Workforce:** Expeditor, Capataz, Operario

#### Services
```typescript
// src/services/roles.ts
getCompanyRoles(companyId)         // Fetch all
createRole(params)                 // Create new
updateRole(roleId, updates)        // Update
deleteRole(roleId)                 // Delete (protected)
cloneStandardRoles(companyId)      // Clone 14 templates
```

#### UI Components
- **Page:** `/founder/settings/roles` - Role management
- **Component:** `RoleEditorModal` - Create/edit interface
  - Color picker, module toggles, base role selector

#### Usage Example
```typescript
// Clone standard roles on company creation
await cloneStandardRoles(companyId);

// Create custom role
await createRole({
  company_id: companyId,
  name: "Pañolero",
  base_role: "worker",
  permissions: {
    modules: {
      warehouse: { enabled: true, is_home: true }
    },
    resources: {
      materials: { view: true, request: true }
    }
  }
});
```

#### Migrations
```bash
# Apply all roles migrations
node scripts/apply_company_roles_migrations.js
```

Files:
- `0010_company_roles.sql` - Table + RLS
- `0011_add_functional_role_to_members.sql` - Integration
- `0012_seed_standard_roles.sql` - Templates

#### Next Steps (Phase 2 - Pending)
- [ ] `usePermissions()` hook for frontend
- [ ] Update middleware to load permissions
- [ ] Integrate with `InvitationManager`
- [ ] Dynamic routing based on `is_home` module
- [ ] E2E testing

---

## 🚧 Work in Progress

### Current Phase: **Phase 1.5 - Roles System Integration**

**Phase 1 - Foundation (COMPLETED):**
- ✅ Landing + Auth + User Management
- ✅ Multi-tenant architecture (Companies/Projects)
- ✅ Staff Dashboard (Super Admin)
- ✅ Founder Dashboard (Company Owner)
- ✅ Invitation system (Secure Token Flow)
- ✅ UI Polishing (Tailwind CSS + Legacy Vanilla CSS)
- ✅ Dynamic Roles System (Database + Services + UI)

**Phase 1.5 - Roles Integration (COMPLETED ✅):**
- ✅ Database schema for company_roles
- ✅ 14 standard piping roles templates
- ✅ Service layer (CRUD operations)
- ✅ Founder UI for role management
- ✅ `usePermissions()` hook & Context
- ✅ Permission Components (`<Can>`, `<HasModule>`)
- ✅ Middleware integration (loads permissions + dynamic routing)
- ✅ InvitationManager update (Founder + Admin with privilege restrictions)
- ✅ Lobby displays functional role with color
- ✅ Server-side permission helpers (`can`, `hasModule`, `getUserPermissions`)

**Phase 1.6 - Testing & Refinement (IN PROGRESS):**
- ⏳ E2E tests for complete invitation flow
- ⏳ Route protection with permission helpers
- ⏳ Optional: Client-side hook optimization

**Next Up (Phase 2):**
- ⏳ Engineering Data Loading
- ⏳ Event Contract Definition
- ⏳ Offline Sync Engine

---

## 📞 Support

For questions or issues:
- Review README.md for architecture overview
- Check `.agent/workflows/lukeapp.md` for workspace rules
- Review existing code patterns in `src/services/`

---

**Last Updated:** December 26, 2024
**Version:** Phase 1.5 (Foundation + Roles System)
