/**
 * ROLLBACK SCRIPT - Engineering Revisions Refactor
 * 
 * USE ONLY IF MIGRATION 0016 FAILS OR CAUSES ISSUES
 * 
 * This script will:
 * 1. Restore old schema structure
 * 2. Restore data from backup files
 * 3. Remove new tables
 * 
 * BEFORE RUNNING:
 * Ensure backup files exist in /backups/engineering/
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'engineering')

async function rollbackEngineeringRefactor() {
    console.log('⚠️  STARTING ROLLBACK - Engineering Revisions Refactor')
    console.log('This will restore the old schema structure\n')

    // Find latest backup
    const files = fs.readdirSync(BACKUP_DIR)
    const manifestFiles = files.filter(f => f.startsWith('manifest_'))

    if (manifestFiles.length === 0) {
        console.error('❌ No backup manifest found!')
        console.error(`   Expected location: ${BACKUP_DIR}`)
        process.exit(1)
    }

    const latestManifest = manifestFiles.sort().reverse()[0]
    const timestamp = latestManifest.replace('manifest_', '').replace('.json', '')

    console.log(`📋 Using backup from: ${timestamp}\n`)

    try {
        // 1. Drop new tables
        console.log('🗑️  Dropping new tables...')
        await supabase.rpc('exec_sql', {
            sql: `
        DROP TABLE IF EXISTS weld_executions CASCADE;
        DROP TABLE IF EXISTS bolted_joints CASCADE;
        DROP TABLE IF EXISTS material_take_off CASCADE;
        DROP TABLE IF EXISTS engineering_revisions CASCADE;
      `
        })
        console.log('✅ New tables dropped')

        // 2. Restore old isometrics columns
        console.log('\n🔧 Restoring old isometrics schema...')
        await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE isometrics 
          DROP COLUMN IF EXISTS current_revision_id,
          ADD COLUMN IF NOT EXISTS rev_id TEXT DEFAULT 'A',
          ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ENGINEERING';
      `
        })
        console.log('✅ Isometrics schema restored')

        // 3. Restore old spools columns
        console.log('\n🔩 Restoring old spools schema...')
        await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE spools
          DROP COLUMN IF EXISTS revision_id,
          ADD COLUMN IF NOT EXISTS isometric_id UUID REFERENCES isometrics;
      `
        })
        console.log('✅ Spools schema restored')

        // 4. Restore old welds columns
        console.log('\n⚡ Restoring old welds schema...')
        await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE welds
          DROP COLUMN IF EXISTS revision_id,
          ADD COLUMN IF NOT EXISTS spool_id UUID REFERENCES spools;
      `
        })
        console.log('✅ Welds schema restored')

        // 5. Restore data from backups
        console.log('\n📥 Restoring data from backups...')

        const isometricsBackup = JSON.parse(
            fs.readFileSync(path.join(BACKUP_DIR, `isometrics_${timestamp}.json`), 'utf-8')
        )
        const spoolsBackup = JSON.parse(
            fs.readFileSync(path.join(BACKUP_DIR, `spools_${timestamp}.json`), 'utf-8')
        )
        const weldsBackup = JSON.parse(
            fs.readFileSync(path.join(BACKUP_DIR, `welds_${timestamp}.json`), 'utf-8')
        )

        // Clear current data
        await supabase.from('welds').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('spools').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('isometrics').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // Restore isometrics
        if (isometricsBackup.length > 0) {
            const { error } = await supabase.from('isometrics').insert(isometricsBackup)
            if (error) throw error
            console.log(`✅ Restored ${isometricsBackup.length} isometrics`)
        }

        // Restore spools
        if (spoolsBackup.length > 0) {
            const { error } = await supabase.from('spools').insert(spoolsBackup)
            if (error) throw error
            console.log(`✅ Restored ${spoolsBackup.length} spools`)
        }

        // Restore welds
        if (weldsBackup.length > 0) {
            const { error } = await supabase.from('welds').insert(weldsBackup)
            if (error) throw error
            console.log(`✅ Restored ${weldsBackup.length} welds`)
        }

        console.log('\n✅ ROLLBACK COMPLETE!')
        console.log('Old schema and data have been restored.')
        console.log('\n⚠️  NEXT STEPS:')
        console.log('1. Review what went wrong with the migration')
        console.log('2. Fix any issues')
        console.log('3. Try migration again')

    } catch (error: any) {
        console.error('\n❌ ROLLBACK FAILED:', error.message)
        console.error('\n⚠️  CRITICAL: Database may be in inconsistent state')
        console.error('Contact support or restore from Supabase dashboard backup')
        process.exit(1)
    }
}

// Confirm before rollback
console.log('\n⚠️  WARNING: This will UNDO the engineering refactor migration')
console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n')

setTimeout(() => {
    rollbackEngineeringRefactor()
}, 5000)
