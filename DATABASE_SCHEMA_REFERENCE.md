# Database Schema Reference

> [!NOTE]
> This document is automatically updated to reflect the current Supabase schema.
> Last Updated: **January 2026**

---

## 🔐 Identity & Access Management

### `users`
**Purpose**: Global user profile registry. Syncs with `auth.users`.
- **Primary Key**: `id` (uuid)
- **RLS**: Disabled (Service Role only for email lookup)
- **Key Columns**:
  - `email` (text): User email
  - `full_name` (text): Display name
  - `avatar_url` (text): Profile picture path

### `roles`
**Purpose**: System-level role definitions.
- **Primary Key**: `id` (user_role enum)
- **Key Values**: `super_admin`, `founder`, `admin`, `supervisor`, `worker`
- **RLS**: Enabled

### `companies`
**Purpose**: Multi-tenant organizations (Tenants).
- **Primary Key**: `id` (uuid)
- **Key Columns**:
  - `name` (text): Company name
  - `tax_id` (text): Legal tax identifier
  - `logo_url` (text): Branding asset
- **RLS**: Enabled

### `members`
**Purpose**: Associates Users with Companies and assigns Roles.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**:
  - `company_id` -> `companies.id`
  - `user_id` -> `users.id`
  - `role_id` -> `roles.id`
- **RLS**: Enabled

### `invitations`
**Purpose**: Pending company memberships via email invites.
- **Primary Key**: `id` (uuid)
- **Key Columns**:
  - `email` (text): Invitee email
  - `token` (text): Secure invite token
  - `role_id` (user_role): Role to assign upon acceptance
- **RLS**: Enabled

---

## 🔒 Multi-Tenant Constraints & Business Rules

> [!IMPORTANT]
> **Migration**: `add_member_role_constraints_v2` (2026-01-17)
> 
> Strict constraints enforce the business model where:
> - `super_admin`: LukeAPP HQ only, no projects
> - `founder`: Company-wide access (project_id = NULL)
> - `admin`/`supervisor`/`worker`: Project-scoped (project_id NOT NULL)

### Members Table Constraints

#### **CHECK: `check_project_id_by_role`**
```sql
CHECK (
  (role_id IN ('super_admin', 'founder') AND project_id IS NULL) OR
  (role_id IN ('admin', 'supervisor', 'worker') AND project_id IS NOT NULL)
)
```
**Purpose**: Ensures founders manage all company projects while admins only access their assigned project.

#### **TRIGGER: `validate_super_admin_company()`**
```sql
-- Prevents super_admin in client companies
-- Only allows super_admin in company with slug = 'lukeapp-hq'
```
**Purpose**: Restricts super_admin role to LukeAPP staff only.

### RLS Policy Architecture

> [!NOTE]
> **Migration**: `strengthen_project_rls_policies` (2026-01-17)

#### **Projects Access**
- **super_admin** → All projects (staff oversight)
- **founder** → All projects where `company_id` matches their company
- **admin/supervisor/worker** → Only where `project_id` matches their assignment

#### **Invitations Scope**
- **super_admin** → Can invite to any company
- **founder** → Can invite to any project within their company
- **admin** → Can ONLY invite to their assigned `project_id`

#### **Material Requests Isolation**
- Filtered by `project_id` for project-scoped roles
- Company-wide access for founders
- Global access for super_admin



## 💳 Billing & Subscriptions

### `subscription_plans`
**Purpose**: Definition of SaaS pricing tiers and limits.
- **Primary Key**: `id` (text, e.g., 'free', 'pro')
- **Key Columns**:
  - `price_monthly`, `price_yearly` (integer)
  - `max_projects`, `max_storage_gb`, `max_members` (integer): Plan limits
- **RLS**: Enabled

### `subscriptions`
**Purpose**: Active subscription state for a Company.
- **Primary Key**: `company_id` (uuid) -> `companies.id`
- **Key Columns**:
  - `plan_id` (text) -> `subscription_plans.id`
  - `status` (text): 'active', 'past_due', etc.
  - `current_period_end` (timestamptz)
- **RLS**: Enabled

### `invoices`
**Purpose**: Billing history and PDF references.
- **Primary Key**: `id` (text, Stripe Invoice ID)
- **Key Columns**:
  - `company_id` (uuid) -> `companies.id`
  - `amount` (integer): Amount in cents
  - `status` (text): 'paid', 'open', etc.
- **RLS**: Enabled

---

## 🏗️ Projects & Core Data

### `projects`
**Purpose**: Engineering or Construction projects owned by a Company.
- **Primary Key**: `id` (uuid)
- **Key Columns**:
  - `company_id` (uuid) -> `companies.id`
  - `name` (text): Project title
  - `code` (text): Short project code
  - `status` (text): Project status
  - `start_date`, `end_date` (date)
- **RLS**: Enabled

### `project_locations`
**Purpose**: Physical areas or zones within a project (e.g., "Main Hall", "Sector A").
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `project_id` -> `projects.id`
- **Key Columns**:
  - `name` (text): Location name
  - `description` (text)
- **RLS**: Enabled

---

## 📦 Materials & Procurement

### `material_catalog`
**Purpose**: Master catalog of construction materials specs and codes.
> [!IMPORTANT]
> Unique Constraint: `(project_id, ident_code, spec_code)` (See Migration 0065)

- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `project_id`, `company_id`
- **Key Columns**:
  - `ident_code` (text): Material ID
  - `spec_code` (text): Specification/Class
  - `short_desc`, `long_desc` (text)
  - `part_group` (text)
  - `commodity_code` (text)
- **RLS**: Enabled (Company/Project scoped)

### `material_requests`
**Purpose**: Field requests for materials (Requisitions).
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `project_id`, `created_by`
- **Key Columns**:
  - `request_number` (serial/text)
  - `status` (text): 'draft', 'submitted', 'approved', 'fulfilled'
  - `required_date` (date)
- **RLS**: Enabled

### `request_items`
**Purpose**: Line items within a Material Request.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**:
  - `request_id` -> `material_requests.id`
- **Key Columns**:
  - `ident_code` (text): Reference to catalog
  - `quantity_requested` (numeric)
  - `quantity_fulfilled` (numeric)
- **RLS**: Enabled

### `inventory_movements`
**Purpose**: Stock flow tracking (In/Out).
- **Primary Key**: `id` (uuid)
- **Key Columns**:
  - `item_id` (uuid): Reference to inventory item
  - `type` (text): 'receipt', 'issue', 'adjustment'
  - `quantity` (numeric)
- **RLS**: Enabled

---

## 🔧 Engineering & Construction (BIM)

### `spools`
**Purpose**: Prefabricated pipe segments (BIM Entities).
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `project_id`
- **Key Columns**:
  - `name` (text): Spool Tag/Number
  - `status` (text): Fabrication status
  - `area`, `system`, `line_number` (text): Engineering attributes
  - `revision` (integer): Current revision number
  - `status_divided` (text): Split status (Migration 0117)
- **RLS**: Enabled

### `revisions`
**Purpose**: Version history for Spools/Drawings.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `spool_id` -> `spools.id`
- **Key Columns**:
  - `revision_number` (integer)
  - `file_url`, `pdf_url` (text): Storage paths
  - `issued_at` (timestamptz)
- **RLS**: Enabled

### `spools_welds`
**Purpose**: Welding points within a Spool.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `spool_id`
- **Key Columns**:
  - `name` (text): Weld tag
  - `size` (text): Diameter
  - `type` (text): Weld type (BW, SW, etc.)
  - `material_type` (text)
  - `status` (text): NDE/QA Status
- **RLS**: Enabled

### `spools_joints`
**Purpose**: Mechanical joints (Flanges, Threaded) within a Spool.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `spool_id`
- **Key Columns**:
  - `name` (text): Joint tag
  - `type` (text): Joint type
  - `status` (text): Assembly status
  - `executed_rev` (text): Revision executed at
  - `photo_url` (text): QA photo proof
- **RLS**: Enabled

### `weld_status_history`
**Purpose**: Audit trail for Weld status transitions.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `weld_id` -> `spools_welds.id`, `changed_by` -> `auth.users.id`
- **Key Columns**:
  - `previous_status`, `new_status` (text)
  - `changed_at` (timestamptz)
- **RLS**: Enabled

### `joint_status_history`
**Purpose**: Audit trail for Joint status transitions.
- **Primary Key**: `id` (uuid)
- **Foreign Keys**: `joint_id` -> `spools_joints.id`, `changed_by` -> `auth.users.id`
- **Key Columns**:
  - `previous_status`, `new_status` (text)
  - `changed_at` (timestamptz)
- **RLS**: Enabled
