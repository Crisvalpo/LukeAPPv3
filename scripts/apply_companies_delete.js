const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
-- Add DELETE policy for companies (Super Admin only)

CREATE POLICY "Super admins can delete companies"
  ON public.companies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.user_id = auth.uid()
      AND members.role_id = 'super_admin'
    )
  );
`

async function executeSQLDirect() {
    console.log('🔧 Agregando DELETE policy para companies...\n')

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

        console.log('✅ DELETE policy para companies aplicada exitosamente!')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
