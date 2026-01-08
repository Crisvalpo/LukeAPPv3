const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

async function getProjectKeys() {
    console.log('🔑 Fetching API Keys from Supabase...\n')

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/api-keys`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        const keys = await response.json()

        const serviceKey = keys.find(k => k.name === 'service_role')?.api_key
        const anonKey = keys.find(k => k.name === 'anon')?.api_key

        if (serviceKey) {
            console.log('✅ SERVICE_ROLE_KEY Found (Masked):', serviceKey.substring(0, 10) + '...')
            console.log('✅ SERVICE_ROLE_KEY Full:', serviceKey)
        } else {
            console.error('❌ Service Role Key not found in response.')
        }

    } catch (error) {
        console.error('❌ Error fetching keys:', error.message)
    }
}

getProjectKeys()
