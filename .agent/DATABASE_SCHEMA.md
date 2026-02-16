# Database Schema Reference: LukeAPP v3

Comprehensive reference of the Supabase / Postgres data structures and security policies.

---

## 🔐 1. Identity & Access Management

### `users`
Global user profiles. Synchronized with `auth.users`.
- **Primary Key**: `id` (uuid)
- **RLS**: Enabled (Users can read/edit their own profile).
- **Audit Rule**: Ghost accounts (LukeAPP Staff) are hidden from lists.

### `company_roles`
Functional role definitions (Layer B).
- **Core Columns**: `name`, `color`, `base_role` (System Role), `permissions` (JSONB).
- **Permissions**: Defines module access (e.g., `procurement`) and resource level actions (view/create/delete).

### `members`
The relational core linking Users to Companies and Projects.
- **Constraints**:
    - `super_admin`/`founder`: Project ID must be NULL.
    - `admin`/`supervisor`/`worker`: Project ID must be NOT NULL.
- **RLS Policy**: Access is strictly scoped to the user's `project_id` or `company_id`.

### `invitations`
Secure, link-based onboarding.
- **Keys**: `email`, `token`, `role_id`, `primary_specialty_id`.
- **Logic**: Upon acceptance, the system automatically creates/reactivates a `members` record.

---

## 🏛️ 2. AWP & Project Hierarchy

### `projects`
Entity representing a specific construction contract.
- **Keys**: `company_id`, `name`, `code`.

### `specialties`
The discipline catalog (CIV, MEC, ELE, etc.).
- **Usage**: Links to `members.primary_specialty_id` for expert roles.
- **Global Context**: If a member has NO specialty assigned, they are treated as "Global/TODAS" (e.g., Project Manager, Expeditor).

### `locations` / `areas` (CWA)
Physical zones within a project.
- **Purpose**: Geographical filtering for all entities.

---

## 📦 3. Materials & Procurement

### `material_catalog`
Master technical item registry.
- **Unique Constraint**: `(project_id, ident_code, COALESCE(spec_code, ''))`.
- **Logic**: Supports multiple specifications for the same identification code.
- **Performance**: High-performance bulk loaders implemented in `material-catalog.ts`.

### `material_requests` & `request_items`
Field requisitions.
- **Workflow**: Draft -> Submitted -> Approved -> Fulfilled.
- **Audit**: Every inventory movement is linked back to a request or item.

---

## 🔧 4. Industrial Entities (Multi-discipline)

### `spools` (Piping/MEC)
Prefabricated segments.
- **Tracking**: Area, System, Line Number, Revision.

### `welds` & `joints`
Specific production points within a spool or structure.
- **History**: Audit trails for status changes (e.g., `WELDED` -> `RT_READY`).
- **QA**: Photo proofs stored in Supabase Storage.

---

## 🛡️ 5. RLS Policy Architecture

### Recursion Protection
To avoid `infinite recursion` when checking permissions in the `members` table:
1. **Security Definer Function**: Create `is_super_admin()` or `get_user_role()`.
2. **Policy**: Use the function instead of a direct subquery on the table.

### Policy Patterns
- **Owner Access**: `auth.uid() = user_id`.
- **Scope Access**: `EXISTS (SELECT 1 FROM members WHERE project_id = current.project_id AND user_id = auth.uid())`.
- **Founder Bypass**: Founders see all records where `company_id` matches.

---
**This document supersedes the root DATABASE_SCHEMA_REFERENCE.md.**
