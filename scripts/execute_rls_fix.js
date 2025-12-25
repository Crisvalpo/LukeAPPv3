// Script para ejecutar SQL en Supabase
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const sql = `
-- Drop policies problemáticas
drop policy if exists "Users can view invitations for their email" on public.invitations;
drop policy if exists "Users can accept their own invitations" on public.invitations;

-- Policy simplificada
create policy "Users can view pending invitations"
  on public.invitations
  for select
  using (
    status = 'pending' 
    and expires_at > now()
  );

create policy "Users can update via RPC only"
  on public.invitations
  for update
  using (false);
`

async function executSQL() {
    console.log('🔧 Ejecutando fix de RLS policies...\n')

    const response = await fetch(`${PROJECT_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
        console.error('❌ Error:', response.status, response.statusText)
        const text = await response.text()
        console.error(text)

        // Intentar método alternativo: pgrest
        console.log('\n⚡ Intentando método directo...')

        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

        // Ejecutar statement por statement
        const statements = sql.split(';').filter(s => s.trim())

        for (const stmt of statements) {
            if (!stmt.trim()) continue
            console.log('Ejecutando:', stmt.substring(0, 60) + '...')

            const { error } = await supabase.rpc('exec_sql', { sql: stmt.trim() + ';' })
            if (error) {
                console.log('  ⚠️', error.message)
            } else {
                console.log('  ✅ OK')
            }
        }
    } else {
        console.log('✅ SQL ejecutado exitosamente')
    }
}

executSQL().catch(console.error)
