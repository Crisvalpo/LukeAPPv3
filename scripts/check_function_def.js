const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
SELECT 
    proname, 
    prosecdef, -- true if security definer
    prosrc,    -- source code
    proconfig  -- runtime configuration (search_path)
FROM pg_proc 
WHERE proname IN ('is_super_admin', 'get_my_founder_companies');
`

async function executeSQLDirect() {
    console.log('🔍 Checking Function Definitions...\n')

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
        console.log('✅ Functions:', JSON.stringify(result, null, 2))

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
