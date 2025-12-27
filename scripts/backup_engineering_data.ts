/**
 * BACKUP SCRIPT - Engineering Data
 * 
 * Exports current engineering tables before refactor migration.
 * Run BEFORE executing 0016_engineering_revisions_refactor.sql
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'engineering')

async function backupEngineeringData() {
    console.log('🔄 Starting engineering data backup...')

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    try {
        // 1. Backup isometrics
        console.log('📋 Backing up isometrics...')
        const { data: isometrics, error: isoError } = await supabase
            .from('isometrics')
            .select('*')

        if (isoError) throw isoError

        fs.writeFileSync(
            path.join(BACKUP_DIR, `isometrics_${timestamp}.json`),
            JSON.stringify(isometrics, null, 2)
        )
        console.log(`✅ Backed up ${isometrics?.length || 0} isometrics`)

        // 2. Backup spools
        console.log('🔩 Backing up spools...')
        const { data: spools, error: spoolsError } = await supabase
            .from('spools')
            .select('*')

        if (spoolsError) throw spoolsError

        fs.writeFileSync(
            path.join(BACKUP_DIR, `spools_${timestamp}.json`),
            JSON.stringify(spools, null, 2)
        )
        console.log(`✅ Backed up ${spools?.length || 0} spools`)

        // 3. Backup welds
        console.log('⚡ Backing up welds...')
        const { data: welds, error: weldsError } = await supabase
            .from('welds')
            .select('*')

        if (weldsError) throw weldsError

        fs.writeFileSync(
            path.join(BACKUP_DIR, `welds_${timestamp}.json`),
            JSON.stringify(welds, null, 2)
        )
        console.log(`✅ Backed up ${welds?.length || 0} welds`)

        // 4. Create backup manifest
        const manifest = {
            timestamp,
            tables: {
                isometrics: isometrics?.length || 0,
                spools: spools?.length || 0,
                welds: welds?.length || 0
            },
            supabase_url: supabaseUrl,
            backup_location: BACKUP_DIR
        }

        fs.writeFileSync(
            path.join(BACKUP_DIR, `manifest_${timestamp}.json`),
            JSON.stringify(manifest, null, 2)
        )

        console.log('\n✅ BACKUP COMPLETE!')
        console.log(`📁 Location: ${BACKUP_DIR}`)
        console.log(`📝 Manifest: manifest_${timestamp}.json`)
        console.log('\n⚠️  IMPORTANT: Keep these files safe before running migration!')

    } catch (error: any) {
        console.error('❌ Backup failed:', error.message)
        process.exit(1)
    }
}

backupEngineeringData()
