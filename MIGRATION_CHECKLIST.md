# Engineering Refactor - Pre-Migration Checklist

## ⚠️ CRITICAL: Before Running Migration

### Step 1: Add Environment Variables

Create or update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "Project URL" and "anon/public" key

---

### Step 2: Run Backup

```bash
npx tsx scripts/backup_engineering_data.ts
```

**Expected output:**
```
✅ Backed up X isometrics
✅ Backed up X spools  
✅ Backed up X welds
📁 Location: backups/engineering/
```

---

### Step 3: Execute Migration

```bash
npx tsx scripts/execute_migration.ts supabase/migrations/0016_engineering_revisions_refactor.sql
```

---

### Step 4: Verify Migration

Run these SQL queries in Supabase Dashboard:

```sql
-- Check all isometrics have revisions
SELECT COUNT(*) as missing_revisions 
FROM isometrics 
WHERE current_revision_id IS NULL;
-- Should return 0

-- Check all spools have revision_id
SELECT COUNT(*) as missing_revision_id 
FROM spools 
WHERE revision_id IS NULL;
-- Should return 0

-- Check all welds have revision_id
SELECT COUNT(*) as missing_revision_id 
FROM welds 
WHERE revision_id IS NULL;
-- Should return 0

-- View created revisions
SELECT 
  er.rev_code,
  i.iso_number,
  er.revision_status,
  er.spools_loaded,
  er.welds_loaded
FROM engineering_revisions er
INNER JOIN isometrics i ON i.id = er.isometric_id
ORDER BY i.iso_number, er.rev_code;
```

---

## 🆘 If Something Goes Wrong

### Option 1: Automated Rollback

```bash
npx tsx scripts/rollback_engineering_refactor.ts
```

### Option 2: Manual Rollback via Supabase Dashboard

1. Go to SQL Editor
2. Run rollback SQL (available in rollback script)
3. Restore from backups (if available)

---

## 📝 What This Migration Does

1. **Creates** `engineering_revisions` table (central entity)
2. **Migrates** existing isometrics → creates one revision per isometric
3. **Refactors** spools table: `isometric_id` → `revision_id`
4. **Refactors** welds table: `spool_id` → `revision_id`
5. **Creates** new tables:
   - `material_take_off` (MTO data)
   - `bolted_joints` (flanged joints data)
   - `weld_executions` (production tracking)

---

## ✅ Post-Migration Tasks

After successful migration:

1. Update application code (services, components)
2. Test new upload flows
3. Update documentation
4. Train users on new 2-phase upload process

---

## Current Status

- [x] Backup script created
- [x] Migration SQL created  
- [x] Rollback script created
- [ ] **Environment variables configured** ← YOU ARE HERE
- [ ] Backup executed
- [ ] Migration executed
- [ ] Verification completed
