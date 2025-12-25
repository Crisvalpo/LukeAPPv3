const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
-- Agregar policy para permitir DELETE de invitaciones (Super Admins)

create policy "Super admins can delete invitations"
  on public.invitations
  for delete
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );
`

async function executeSQLDirect() {
    console.log('🔧 Agregando policy de DELETE para invitaciones...\n')

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

        console.log('✅ DELETE policy agregada exitosamente!')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
