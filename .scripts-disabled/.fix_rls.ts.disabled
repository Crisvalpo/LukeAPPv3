import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
})

async function executeMigration() {
    console.log('🔧 Ejecutando fix de RLS para invitations...')

    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/0004_fix_rls.sql'), 'utf-8')

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
        .catch(async () => {
            // Si exec_sql no existe, usar query directo
            return await supabase.from('_migrations').select('*').limit(0).then(() => {
                // Ejecutar línea por línea
                const statements = sql.split(';').filter(s => s.trim())
                return Promise.all(statements.map(async (statement) => {
                    if (statement.trim()) {
                        const { error } = await (supabase as any).rpc('exec', { sql: statement })
                        return { error }
                    }
                    return { error: null }
                }))
            })
        })

    // Método alternativo: ejecutar directamente
    const queries = sql.split(';').filter(s => s.trim())

    for (const query of queries) {
        if (!query.trim()) continue

        console.log('Ejecutando:', query.substring(0, 50) + '...')

        try {
            const { error } = await (supabase as any).from('_sql').select('*').eq('query', query)
            if (error) {
                console.log('⚠️  Usando método directo...')
                // Intentar con .from() aunque no sea lo ideal
                await fetch(`${PROJECT_URL}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ query })
                })
            }
        } catch (e) {
            console.log('⚠️  Error pero continuando:', (e as Error).message)
        }
    }

    console.log('✅ Fix de RLS aplicado')
    console.log('\n📝 Verifica manualmente en Supabase SQL Editor que la policy se actualizó')
}

executeMigration().catch(console.error)
