---
title: View Architecture Review & refactor Plan
date: 2025-12-25
status: Proposed
---

## 🚨 Diagnosis: Critical Alignment Issues

We have reviewed the current codebase (`src/app/**`, `src/components/ui/DataGrid.tsx`) against the **Derived UI (AppSheet-like)** and **Vanilla CSS** rules.

### 1. Architectural Misalignment (Ad-Hoc vs. Derived)

**Current State (Ad-Hoc):**
*   Pages like `CompaniesPage` and `ProjectsListPage` manually construct their UI.
*   They mix **State Management** (fetching, error handling) with **Presentation** (HTML structure).
*   Every new entity requires copying/pasting 80% of the boilerplate (loading states, empty states, table headers).
*   **Result:** High maintenance, low consistency, hard to "scale" to new entities.

**Expected State (Derived/AppSheet-like):**
*   **"Derive, don't design"**: The UI should be generated from a *definition*.
*   A View is just configuration: "This is a List of Companies, show columns A, B, C."
*   Logic (Search, Filter, Pagination, Loading) handles itself centrally.

### 2. Validation Violation: Tailwind CSS Usage

**Critical Finding:**
The component `src/components/ui/DataGrid.tsx` utilizes **Tailwind CSS classes** (`text-slate-500`, `w-full`, `hover:bg-white/5`), which explicitly violates the project's **"100% Vanilla CSS"** rule found in `README.md` and `workflow/lukeapp.md`.

---

## 🏗️ Refactor Plan: The "View System"

We propose implementing a strict **View System** that separates **Metadata** from **Rendering**.

### Step 1: Define the Schemas (Metadata)

Create a `src/schemas` directory to define the "Shape" of our entities for the UI.

```typescript
// src/schemas/company.ts
import { Building2 } from 'lucide-react'

export const CompanySchema = {
  entity: 'company',
  label: { singular: 'Empresa', plural: 'Empresas' },
  icon: Building2,
  fields: {
    name: { type: 'text', label: 'Nombre', required: true },
    slug: { type: 'text', label: 'Slug', readOnly: true },
    created_at: { type: 'date', label: 'Registro' }
  },
  views: {
    list: {
      columns: ['name', 'slug', 'created_at'],
      actions: ['edit', 'delete']
    }
  }
}
```

### Step 2: Build Canonical Views (The "Engine")

Refactor `src/components/views/` to contain the 5 canonical view engines, written in **Pure Vanilla CSS**.

1.  **`ListView`**: Handles data fetching, display (Grid/Table), search, and filtering automatically based on schema.
2.  **`FormView`**: Generates form inputs based on field types (`text` -> input, `date` -> datepicker).
3.  **`DashboardView`**: Layout for KPIs.

### Step 3: Refactor Pages

The page code becomes minimal and declarative:

```tsx
// src/app/(dashboard)/staff/companies/page.tsx
import { ListView } from '@/components/views/ListView'
import { CompanySchema } from '@/schemas/company'

export default function CompaniesPage() {
  return <ListView schema={CompanySchema} />
}
```

### Step 4: Fix Styles (Clean-up)

Delete `DataGrid.tsx` (Tailwind) and replace it with a properly styled `Table` component using `src/styles/components/data-grid.css`.

---

## 📋 Execution Order

1.  **Scaffold**: Create `src/schemas/` and `src/components/views/`.
2.  **Style Fix**: Create generic Vanilla CSS for Tables and Forms.
3.  **Migration**: Refactor `Companies` page to use the new system.
4.  **Verification**: Ensure no Tailwind classes remain.
