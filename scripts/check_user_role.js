const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
SELECT 
    u.id as user_id, 
    u.email, 
    m.role_id, 
    m.company_id 
FROM public.users u
LEFT JOIN public.members m ON u.id = m.user_id
WHERE u.email = 'cristianluke@gmail.com';
`

async function executeSQLDirect() {
    console.log('🔍 Checking User Data...\n')

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
            throw new Error(await response.text())
        }

        const result = await response.json()
        console.log('✅ User Data:', JSON.stringify(result, null, 2))

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
