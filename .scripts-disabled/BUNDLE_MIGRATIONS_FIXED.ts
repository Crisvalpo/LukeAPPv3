import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const OUTPUT_FILE = join(process.cwd(), 'supabase', 'FULL_DATABASE_SETUP.sql');

// The Safe List from REBOOT_PROJECT.ts - EXPLICIT ORDER IS CRITICAL
const MIGRATIONS = [
    // Phase 1: Foundation
    '0000_fase1_foundation.sql',
    '0001_add_job_titles.sql',
    '0010_company_roles.sql',
    '0011_add_functional_role_to_members.sql',
    '0012_seed_standard_roles.sql',
    '0013_allow_admin_invitations.sql',

    // Phase 2: Engineering Brain
    // '0014_phase2_revisions_init.sql', // SKIPPED
    '0015_production_schema.sql',
    '0016_engineering_revisions_refactor.sql', // Creates table engineering_revisions
    '0014b_revisions_events_only.sql',         // Depends on engineering_revisions
    '0016a_piping_compatibility.sql',
    // '0016b_engineering_revisions_refactor.sql', // SKIPPED

    '0017_add_announcement_metadata.sql',
    // '0018_isometric_status_system.sql', // SKIPPED
    '0018b_isometric_status_system_fix.sql',
    '0019_add_company_id_to_isometrics.sql',
    '0020_add_rls_engineering_revisions.sql',
    '0021_fix_rls_engineering_revisions.sql',
    '0022_add_company_id_to_eng_revisions.sql',
    '0023_optimize_rls_engineering_revisions.sql',
    '0024_add_mto_and_align_details.sql',
    '0025_create_spools_welds_table.sql',

    // Phase 3: Material Control
    '0027_material_control_foundation.sql',
    '0028_revision_status_extensions.sql',
    '0029_mto_support.sql',
    '0030_joints_support.sql',
    '0031_fix_and_restore_spools.sql',
    '0032_fix_rls_mto_joints.sql',
    '0033_cleanup_unused_tables.sql',
    '0034_force_schema_refresh.sql',
    '0035_add_requires_joints_flag.sql',
    '0036_material_catalog.sql',
    '0037_pipe_inventory.sql',
    '0038_add_company_id_to_revisions.sql',
    '0039_add_missing_revision_columns.sql',
    // '0040_create_missing_revisions.sql', // SKIPPED
    '0041_fix_function_security_part1.sql',
    '0042_enable_rls_roles.sql',
    '0043_optimize_critical_rls.sql',
    '0044_fix_members_recursion.sql',
    '0045_disable_members_rls.sql',
    '0045_disable_members_rls.sql', // Duplicate in list but harmless (idempotent)
    '0046_disable_users_rls.sql',
    '0047_robust_auth_fix.sql',
    '0048_restore_dashboard_rpc.sql',

    // GENESIS
    'SEED_genesis.sql'
];

let fullSql = '-- LUKEAPP V3 FULL DATABASE SETUP (CORRECT EXECUTION ORDER)\n';
fullSql += '-- Generated automatically from Safe List\n\n';

// Add explicit DROP SCHEMA to ensure clean slate if user runs it
fullSql += '-- 0. NUCLEAR WIPE PREAMBLE\n';
fullSql += 'DROP SCHEMA public CASCADE;\n';
fullSql += 'CREATE SCHEMA public;\n';
fullSql += 'GRANT ALL ON SCHEMA public TO postgres;\n';
fullSql += 'GRANT ALL ON SCHEMA public TO public;\n';
fullSql += 'GRANT ALL ON SCHEMA public TO anon;\n';
fullSql += 'GRANT ALL ON SCHEMA public TO authenticated;\n';
fullSql += 'GRANT ALL ON SCHEMA public TO service_role;\n\n';

console.log('📦 Consolidating migrations in SAFE ORDER...\n');

for (const file of MIGRATIONS) {
    const filePath = join(MIGRATIONS_DIR, file);

    if (!existsSync(filePath)) {
        console.warn(`⚠️ Warning: File not found, skipping: ${file}`);
        continue;
    }

    console.log(`Paper-clipping: ${file}`);
    const content = readFileSync(filePath, 'utf-8');

    fullSql += `\n\n-- ==================================================================\n`;
    fullSql += `-- MIGRATION: ${file}\n`;
    fullSql += `-- ==================================================================\n\n`;
    fullSql += content + '\n';
}

writeFileSync(OUTPUT_FILE, fullSql);
console.log(`\n✅ Created consolidated SQL file at: ${OUTPUT_FILE}`);
console.log(`Copy content >> Paste in Supabase SQL Editor >> Run`);
