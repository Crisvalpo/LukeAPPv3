const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
drop policy if exists "Users can view invitations for their email" on public.invitations;
drop policy if exists "Users can accept their own invitations" on public.invitations;

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

async function executeSQLDirect() {
    console.log('🔧 Ejecutando fix de RLS policies...\n')

    try {
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

        console.log('✅ SQL ejecutado exitosamente!')
        console.log(result)

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
