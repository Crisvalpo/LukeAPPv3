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
└── styles/              # CSS files (100% Vanilla CSS)
    ├── globals.css      # Global styles & CSS variables
    ├── dashboard.css    # Dashboard common styles
    ├── companies.css    # Companies specific
    ├── invitations.css  # Invitations specific
    └── ...

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

**100% Vanilla CSS** - NO Tailwind, NO CSS-in-JS

```typescript
// ❌ BAD
<div className="flex items-center gap-4">

// ✅ GOOD
// ✅ GOOD
<div className="company-header-content">
```

### 🎨 Design System & UI Standards (STRICT)

**Consistency is King.** The application must look and feel like a single cohesive product. DO NOT introduce new styles unless absolutely necessary.

#### 1. Core Styles (`dashboard.css`)
All dashboard pages MUST use the standard classes defined in `src/styles/dashboard.css`.
- **Layout**: Use `.dashboard-page`, `.dashboard-header`.
- **Forms**: ALWAYS use `.company-form`, `.form-field`, `.form-label`, `.form-input`.
- **Buttons**: ALWAYS use `.form-button` (primary) or `.action-button` (secondary/icon).
- **Typography**: Never manually set font-sizes in inline styles unless absolutely necessary for a unique KPI. Use global headings.

#### 2. Component Consistency
- **Buttons**: Main actions are always on the right or bottom. Primary = Purple/Blue gradient. Secondary = Ghost/Glass.
- **Inputs**: All text inputs must have the same height, padding (`0.75rem`), and background (`rgba(15, 23, 42, 0.3)`).
- **Cards**: Use glassmorphism styling consistently.

#### 3. New Features Guidelines
When building new features (e.g. Project Details):
- ❌ **DO NOT** create unique CSS files that redefine base typography or form inputs.
- ✅ **REUSE** existing `dashboard.css` classes.
- If a new style is needed, add it to `dashboard.css` as a utility so it can be reused.


All styles in dedicated CSS files:
- `src/styles/dashboard.css` - Common dashboard styles
- `src/styles/companies.css` - Companies-specific
- Feature-specific CSS files as needed

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

### Future: Dynamic Functional Roles
**Phase 2** will introduce `company_roles` table:
- Companies define custom roles (e.g., "Oficina Técnica", "Calidad")
- Each custom role maps to a base `SystemRole`
- Permissions stored as JSONB for granular control
- See `technical_spec_dynamic_roles.md` for full design

---

## 🚧 Work in Progress

### Current Phase: **Transitioning to Phase 2**

**Phase 1 - Foundation (COMPLETED):**
- ✅ Landing + Auth + User Management
- ✅ Multi-tenant architecture (Companies/Projects)
- ✅ Staff Dashboard (Super Admin)
- ✅ Founder Dashboard (Company Owner)
- ✅ Invitation system (Secure Token Flow)
- ✅ UI Polishing (100% Vanilla CSS)

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

**Last Updated:** December 2024
**Version:** Phase 1 (Foundation)
