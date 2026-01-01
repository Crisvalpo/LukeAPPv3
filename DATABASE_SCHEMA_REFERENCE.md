# Database Schema Reference

## Material Catalog Module

### Table: `material_catalog`

**Purpose**: Stores the master catalog of construction materials for each project.

**Key Columns**:
- `id` (uuid, PK): Unique identifier
- `company_id` (uuid, FK): Company owner
- `project_id` (uuid, FK): Project scope  
- `ident_code` (text, NOT NULL): Material identification code
- `spec_code` (text, NULLABLE): Technical specification code
- `short_desc` (text): Short description
- `long_desc` (text): Detailed description
- `commodity_code` (text): Category/commodity classification
- `part_group` (text): Part grouping
- `unit_weight` (numeric): Weight per unit
- `custom_fields` (jsonb): Flexible additional data
- `created_at`, `updated_at` (timestamptz): Audit timestamps

**Unique Constraints**:

#### Current (Migration 0065 - Jan 2025)
```sql
CREATE UNIQUE INDEX idx_material_catalog_unique_key 
ON material_catalog (project_id, ident_code, COALESCE(spec_code, ''));
```

**Behavior**:
- Allows multiple specifications for the same `ident_code`
- Unique key = `(project_id, ident_code, spec_code)`
- NULL `spec_code` is coalesced to `''` for uniqueness

**Example Data**:
```
project_id | ident_code | spec_code | short_desc
-----------|------------|-----------|------------
proj-123   | A403       | K42       | 90 LR ELBOW
proj-123   | A403       | S3P00     | 90 LR ELBOW (different spec)
proj-123   | A403       | NULL      | 90 LR ELBOW (no spec)
```

All three rows are valid and unique.

#### Previous (Before 0065)
```sql
CONSTRAINT unique_ident_per_project UNIQUE(project_id, ident_code)
```
- Only ONE entry per `ident_code` per project
- Multiple specs not allowed

**RLS Policies**:
- `authenticated` users can SELECT, INSERT, UPDATE, DELETE
- Scoped by `company_id` and `project_id`

**Performance Notes**:
- Index on `(project_id, ident_code)` for lookups
- Bulk operations use chunking (100 items per batch)
- Optimized for 2000+ item imports (<10 seconds)

---

## Migration History

### 0065_update_material_catalog_constraint.sql (Jan 2025)
**Purpose**: Enable multi-specification support

**Changes**:
1. Dropped `unique_ident_per_project` constraint
2. Created `idx_material_catalog_unique_key` functional index
3. Updated application logic to handle (Ident + Spec) combinations

**Impact**:
- Breaking change for applications assuming single spec per ident
- Requires updated upload logic in `bulkUploadMaterials()`
- Backward compatible for data (existing single-spec records unaffected)

---

## Related Tables

### `material_requests`
- References `material_catalog` via lookup (not FK to allow flexibility)
- Uses `ident_code` for matching
- Manages quantity requests per spool/location

---

**Last Updated**: 2025-01-01  
**Maintainer**: LukeAPP Development Team
