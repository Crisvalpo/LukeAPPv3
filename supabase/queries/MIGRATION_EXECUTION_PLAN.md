# Migration Execution Plan - FASE 2A Setup

**Current Status:** Missing critical tables detected
- ❌ `engineering_revisions` 
- ❌ `spools_mto`

**Root Cause:** Migrations executed out of order or skipped

---

## Execution Order (CRITICAL - DO NOT CHANGE)

### Step 1: Create `engineering_revisions` table
**File:** `0016b_ULTRA_SIMPLE.sql`  
**Purpose:** Creates the base engineering_revisions table  
**Dependencies:** None (only needs isometrics table, which exists)

```bash
# Execute in Supabase SQL Editor:
supabase/migrations/0016b_ULTRA_SIMPLE.sql
```

**Verification:**
```sql
SELECT COUNT(*) FROM engineering_revisions;
-- Should return 0 (empty table)
```

---

### Step 2: Create MTO Support Tables
**File:** `0029_mto_support.sql`  
**Purpose:** Creates `spools_mto` and `spools_joints` tables  
**Dependencies:** Requires `spools` table (exists ✅)

```bash
# Execute in Supabase SQL Editor:
supabase/migrations/0029_mto_support.sql
```

**Verification:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('spools_mto', 'spools_joints');
-- Should return both tables
```

---

### Step 3: Add Status Columns to Revisions
**File:** `0028_revision_status_extensions.sql`  
**Purpose:** Adds `data_status` and `material_status` columns  
**Dependencies:** Requires `engineering_revisions` table (created in Step 1)

```bash
# Execute in Supabase SQL Editor:
supabase/migrations/0028_revision_status_extensions.sql
```

**Verification:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'engineering_revisions'
  AND column_name IN ('data_status', 'material_status');
-- Should return both columns
```

---

## Post-Migration Validation

Run this after all 3 migrations:

```sql
-- Check all critical tables exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engineering_revisions') THEN '✅' ELSE '❌' END as engineering_revisions,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_mto') THEN '✅' ELSE '❌' END as spools_mto,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_joints') THEN '✅' ELSE '❌' END as spools_joints,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'engineering_revisions' AND column_name = 'data_status') THEN '✅' ELSE '❌' END as data_status_column,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'engineering_revisions' AND column_name = 'material_status') THEN '✅' ELSE '❌' END as material_status_column;
```

**Expected Result:** All ✅

---

## Why This Order?

1. **0016b first** → Creates the base table that 0028 will modify
2. **0029 second** → Independent, creates MTO tables needed for Material Control
3. **0028 last** → Modifies engineering_revisions (depends on step 1)

---

## ⚠️ IMPORTANT NOTES

- Execute ONE migration at a time
- Verify each step before proceeding
- If ANY step fails, STOP and report the error
- These migrations are IDEMPOTENT (safe to re-run)

---

## Ready to Execute?

Reply with "PROCEED" and I'll guide you through each step.
