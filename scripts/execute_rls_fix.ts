import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
})

async function executeSQL() {
    console.log('🔧 Aplicando fix de RLS policies...\n')

    const queries = [
        'drop policy if exists "Users can view invitations for their email" on public.invitations',
        'drop policy if exists "Users can accept their own invitations" on public.invitations',
        `create policy "Users can view pending invitations"
  on public.invitations
  for select
  using (
    status = 'pending' 
    and expires_at > now()
  )`,
        `create policy "Users can update via RPC only"
  on public.invitations
  for update
  using (false)`
    ]

    for (const query of queries) {
        console.log('Ejecutando:', query.substring(0, 50) + '...')

        try {
            // Usar fetch directo al endpoint de Postgres
            const response = await fetch(`${PROJECT_URL}/rest/v1/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'Prefer': 'return=representation',
                    'X-Client-Info': 'supabase-js/2.0.0'
                },
                body: JSON.stringify({
                    query: query
                })
            })

            // Como no hay endpoint directo para SQL arbitrario, usar Postgres directamente
            // Esto requiere pg library, así que mejor sugerir ejecutar manualmente
            console.log('  ⚠️  Supabase REST API no permite SQL arbitrario por seguridad')
            console.log('  📝 Por favor ejecuta este SQL manualmente en Supabase SQL Editor:\n')
            console.log(query + ';\n')
        } catch (e) {
            console.log('  ❌', (e as Error).message)
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📋 COPIAR Y EJECUTAR EN SUPABASE SQL EDITOR:')
    console.log('='.repeat(60))
    console.log(queries.join(';\n\n') + ';')
    console.log('='.repeat(60))
}

executeSQL()
