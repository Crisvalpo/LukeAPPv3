const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

async function getProjectKeys() {
    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/api-keys`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        })
        const keys = await response.json()
        const serviceKey = keys.find(k => k.name === 'service_role')?.api_key
        console.log(serviceKey) // Just the key
    } catch (error) {
        console.error('Error')
    }
}
getProjectKeys()
