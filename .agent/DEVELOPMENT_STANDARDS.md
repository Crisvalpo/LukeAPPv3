# Development Standards & Guidelines

Authoritative guide for contributing to the LukeAPP codebase.

---

## 📁 1. Project Organization

```text
src/
├── app/            # Next.js App Router (Pages, Layouts, API Routes)
├── components/     # React Components
│   ├── ui/         # Reusable Design System elements
│   ├── layout/     # Sidebar, Header, Lobby components
│   └── [module]/   # Feature-specific components (e.g., procurement, engineering)
├── services/       # Business Logic (No Supabase calls allowed outside services)
├── lib/            # Shared config (Supabase Client, Middleware)
├── styles/         # Global CSS & Design System tokens
├── types/          # Centralized TypeScript definitions
└── constants/      # Enums, Routes, and Static Configurations
```

---

## 🛠️ 2. Coding Patterns

### Service Layer Pattern (Strict)
Components **must never** interact with Supabase or external APIs directly. All data access must go through the `src/services/` layer.

```typescript
// ✅ CORRECT
import { getProjectsByCompany } from '@/services/projects'
const data = await getProjectsByCompany(id)

// ❌ INCORRECT
const { data } = await supabase.from('projects').select('*')... 
```

### Type Safety
Use standardized types from `src/types/index.ts`. Avoid `any` at all costs. For database-specific results, use generated types if available.

### Forms & Loading States
- Always implement `isLoading` states.
- Use `InputField` component for consistent error and label handling.
- Use the standard `Button` variants (`primary`, `outline`, `ghost`).

---

## 🎨 3. Styling Standards

### Tailwind CSS v4
- Use Tailwind for all layout, spacing, and responsive needs (e.g., `flex items-center gap-4`).
- Refer to `design-system.css` variables for colors: `bg-[var(--color-primary)]` or better, the mapped Tailwind utility `bg-brand-primary`.

### Naming Conventions
- **Components**: `PascalCase` (e.g., `MultiDisciplineSelector.tsx`).
- **Functions/Variables**: `camelCase` (e.g., `fetchMemberContext()`).
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`).
- **CSS Classes**: `Tailwind standard` or `kebab-case` for legacy.

---

## 🔒 4. Security & Environment

### Credential Safety
**NEVER commit credentials.** Even if they seem public (anon keys).
- All keys must be in `.env.local`.
- Use `process.env.NEXT_PUBLIC_SUPABASE_URL`.
- Scripts must read from `env:` or `.env` files, never hardcoded.

### SQL Migrations
- Create a new file in `supabase/migrations/` with the format `YYYYMMDDHHMMSS_description.sql`.
- Prefer programmatic application via `execute_sql_direct.js` or standard Supabase CLI.
- All tables MUST have RLS enabled and a `super_admin_all_access` policy.

---

## 📝 5. Documentation Workflow
- Maintain a `walkthrough.md` for major sessions.
- Maintain a `task.md` in the brain directory for active tracking.
- Update these `.agent/` docs whenever architectural changes occur.

---
**Review README.md for initial local setup instructions.**
