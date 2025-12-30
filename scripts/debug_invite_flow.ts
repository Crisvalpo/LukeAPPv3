
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabaseAdmin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function debugInviteFlow() {
    console.log('🚀 Debugging User Invite Flow...')
    const email = `test_invite_${Date.now()}@example.com`

    console.log(`Inviting user: ${email}...`)
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: 'Invite Test User' }
    })

    if (error) {
        console.error('❌ Invite Failed:', error)
    } else {
        console.log('✅ Invite Sent/User Created!')
        console.log('User ID:', data.user.id)
        // Check if last_sign_in etc is null?
        console.log('Role:', data.user.role)
    }
}

debugInviteFlow()
