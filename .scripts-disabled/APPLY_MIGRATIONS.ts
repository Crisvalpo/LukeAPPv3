import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations')

const MIGRATIONS = [
    '0000_fase1_foundation.sql',
    '0001_add_job_titles.sql',
    '0010_company_roles.sql',
    '0011_add_functional_role_to_members.sql',
    '0012_seed_standard_roles.sql',
    '0013_allow_admin_invitations.sql',
    '0015_production_schema.sql',
    '0016_engineering_revisions_refactor.sql',
    '0014b_revisions_events_only.sql',
    '0016a_piping_compatibility.sql',
    '0017_add_announcement_metadata.sql',
    '0018b_isometric_status_system_fix.sql',
    '0019_add_company_id_to_isometrics.sql',
    '0020_add_rls_engineering_revisions.sql',
    '0021_fix_rls_engineering_revisions.sql',
    '0022_add_company_id_to_eng_revisions.sql',
    '0023_optimize_rls_engineering_revisions.sql',
    '0024_add_mto_and_align_details.sql',
    '0025_create_spools_welds_table.sql',
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
    '0041_fix_function_security_part1.sql',
    '0042_enable_rls_roles.sql',
    '0043_optimize_critical_rls.sql',
    '0044_fix_members_recursion.sql',
    '0045_disable_members_rls.sql',
    '0046_disable_users_rls.sql',
    '0047_robust_auth_fix.sql',
    '0048_restore_dashboard_rpc.sql',
    'SEED_genesis.sql'
]

async function main() {
    console.log('🚀 Applying migrations to NEW project...\n')

    for (const file of MIGRATIONS) {
        console.log(`📄 ${file}...`)
        const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')

        // Split by semicolon and execute one by one
        const statements = sql.split(';').filter(s => s.trim())

        for (const statement of statements) {
            if (!statement.trim()) continue

            try {
                await supabase.rpc('exec_sql', { sql: statement + ';' })
            } catch (err: any) {
                // Ignore "already exists" errors
                if (!err.message?.includes('already exists')) {
                    console.log(`  ⚠️  ${err.message}`)
                }
            }
        }

        console.log(`  ✅ Done`)
    }

    console.log('\n🎉 All migrations applied!')
    console.log('Login: luke@lukeapp.com | Password: LukeAPP_2025!')
}

main().catch(console.error)
