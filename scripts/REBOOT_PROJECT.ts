
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// CONFIGURATION
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp';
const MANAGEMENT_API = 'https://api.supabase.com/v1';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// 2. MIGRATION MANIFEST (The "Safe List")
const MIGRATIONS = [
    // Phase 1: Foundation
    '0000_fase1_foundation.sql',
    '0001_add_job_titles.sql',
    '0010_company_roles.sql',
    '0011_add_functional_role_to_members.sql',
    '0012_seed_standard_roles.sql',
    '0013_allow_admin_invitations.sql',

    // Phase 2: Engineering Brain
    // '0014_phase2_revisions_init.sql', // SKIPPED: Conflicts with 0015/0016. Replaced by 0014b.
    '0015_production_schema.sql',
    '0016_engineering_revisions_refactor.sql',
    '0014b_revisions_events_only.sql', // NEW: Adds events tables after revisions exist
    '0016a_piping_compatibility.sql',
    // '0016b_engineering_revisions_refactor.sql', // SKIPPED: Redundant/Conflict with 0016

    '0017_add_announcement_metadata.sql',
    // '0018_isometric_status_system.sql', // SKIPPED: Uses removed 'isometrics.status' column
    '0018b_isometric_status_system_fix.sql', // REPLACEMENT: Adapts logic to 0016+ schema
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
    // '0040_create_missing_revisions.sql', // SKIPPED: Hardcoded UUIDs/Patch for old data
    '0041_fix_function_security_part1.sql',
    '0042_enable_rls_roles.sql',
    '0043_optimize_critical_rls.sql',
    '0044_fix_members_recursion.sql',
    '0045_disable_members_rls.sql',
    '0045_disable_members_rls.sql',
    '0046_disable_users_rls.sql',
    '0047_robust_auth_fix.sql', // Critical Auth Trigger
    '0048_restore_dashboard_rpc.sql', // Fix Lobby 404

    // GENESIS
    'SEED_genesis.sql'
];

async function executeSQL(filePath: string, sql: string) {
    if (!SUPABASE_ACCESS_TOKEN) {
        throw new Error('❌ Missing SUPABASE_ACCESS_TOKEN in .env.local. Cannot execute via Management API.');
    }

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Broader check for idempotency errors
            if (
                errorText.includes('already exists') ||
                errorText.includes('duplicate key') ||
                errorText.includes('42P07') ||
                errorText.includes('42710') ||
                errorText.includes('23505')
            ) {
                console.log(`⚠️  Skipping benign error: ${errorText.substring(0, 100)}...`);
                return;
            }
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        try { const json = await response.json(); } catch (e) { }

        console.log('✅ Success');
    } catch (error) {
        throw error;
    }
}

async function runReboot() {
    console.log('🚀 INITIALIZING OPERATION CLEAN SLATE (FINAL 2.0)...');
    console.log(`📂 Executing ${MIGRATIONS.length} migrations...`);

    // 0. EXPLICIT NUCLEAR WIPE
    console.log('\n💥 EXECUTION: DROP SCHEMA public CASCADE...');
    try {
        await executeSQL('NUCLEAR_WIPE', `
        GRANT ALL ON DATABASE postgres TO postgres;
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
        COMMENT ON SCHEMA public IS 'standard public schema';
      `);
        console.log('✅ SCHEMA WIPED AND RECREATED.');
    } catch (e) {
        console.error('❌ Failed to wipe schema. Stopping.');
        console.error((e as Error).message);
        process.exit(1);
    }

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

    for (const filename of MIGRATIONS) {
        const filePath = path.join(migrationsDir, filename);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found, skipping: ${filename}`);
            continue;
        }

        console.log(`\n📄 Processing: ${filename} ...`);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        try {
            await executeSQL(filename, sqlContent);
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
            console.error(`❌ FAILED: ${filename}`);
            console.error((e as Error).message);
            console.log('🛑 Aborting sequence to prevent partial corruption.');
            process.exit(1);
        }
    }

    console.log('\n🎉 REBOOT SEQUENCE COMPLETE!');
    console.log('Please log in with: luke@lukeapp.com (See SEED_genesis.sql for password)');
}

runReboot().catch(console.error);
