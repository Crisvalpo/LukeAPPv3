import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'

async function executeSQLFile(filePath: string) {
    console.log(`📄 Ejecutando: ${filePath}\n`)

    const sql = readFileSync(filePath, 'utf-8')

    // Usar Management API v1
    const MANAGEMENT_API = 'https://api.supabase.com/v1'
    const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

    if (!SUPABASE_ACCESS_TOKEN) {
        console.log('⚠️  SUPABASE_ACCESS_TOKEN no encontrado')
        console.log('📋 Ejecuta manualmente este SQL:\n')
        console.log('='.repeat(70))
        console.log(sql)
        console.log('='.repeat(70))
        console.log('\nURL: https://supabase.com/dashboard/project/rvgrhtqxzfcypbfxqilp/sql/new')
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

// Ejecutar migration 0036 - Material Catalog
executeSQLFile('supabase/migrations/0036_material_catalog.sql')
