import { readFileSync } from 'fs'

const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

async function executeMigration(filePath: string) {
    console.log(`📄 Ejecutando migración: ${filePath}\n`)

    try {
        const sql = readFileSync(filePath, 'utf-8')

        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        })

        const result = await response.text()

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}:`, result)
            throw new Error(result)
        }

        console.log('✅ Migración ejecutada exitosamente!')
        console.log(result)

    } catch (error) {
        console.error('❌ Error:', (error as Error).message)
        process.exit(1)
    }
}

// Get file path from command line arguments
const filePath = process.argv[2]

if (!filePath) {
    console.error('❌ Uso: npx tsx scripts/execute_migration.ts <path-to-sql-file>')
    process.exit(1)
}

executeMigration(filePath)
