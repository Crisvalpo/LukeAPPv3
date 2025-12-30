import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import * as dotenv from 'dotenv'

// Load env vars from .env.local
dotenv.config({ path: '.env.local' })

// Extract Project Ref from URL
const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PROJECT_REF = PROJECT_URL ? PROJECT_URL.split('.')[0].replace('https://', '') : ''

if (!PROJECT_URL || !PROJECT_REF) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL no encontrado en .env.local')
    process.exit(1)
}

async function executeSQLFile(filePath: string) {
    console.log(`📄 Procesando: ${filePath} en proyecto ${PROJECT_REF}\n`)

    const sql = readFileSync(filePath, 'utf-8')

    // Usar Management API v1
    const MANAGEMENT_API = 'https://api.supabase.com/v1'
    const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

    if (!SUPABASE_ACCESS_TOKEN) {
        console.log('⚠️  SUPABASE_ACCESS_TOKEN no encontrado en .env.local')
        console.log('ℹ️  Asegúrate de agregar SUPABASE_ACCESS_TOKEN=[tu-token] en .env.local')
        return
    }

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        const result = await response.json()
        console.log('✅ SQL ejecutado exitosamente')
        console.log(result)
    } catch (error) {
        console.error('❌ Error:', (error as Error).message)
        console.log('\n📋 SQL a ejecutar manualmente:\n')
        console.log('='.repeat(70))
        console.log(sql)
        console.log('='.repeat(70))
    }
}

// Main entry point
const args = process.argv.slice(2);
if (args.length > 0) {
    // Run files provided in arguments
    for (const file of args) {
        // Handle both relative and absolute paths, or just relative to cwd
        // Assuming simple paths for now or mapped to supabase/migrations if just filename given?
        // Let's keep it simple: trusted path.
        let path = file;
        if (!file.includes('/') && !file.includes('\\')) {
            path = `supabase/migrations/${file}`;
        }
        executeSQLFile(path);
    }
} else {
    // Default fallback or usage instruction
    console.log('⚠️  No SQL file specified. Usage: npx ts-node scripts/run_migration.ts <filename>');
    // executeSQLFile('supabase/migrations/DIAG_check_public_and_triggers.sql'); // Optional default
}
