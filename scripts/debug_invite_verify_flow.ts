
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabaseAdmin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function debugInviteVerifyFlow() {
    console.log('🚀 Debugging Invite + Manual Verify Flow...')
    const email = `luketest.bypass.${Date.now()}@gmail.com` // Use gmail to pass validation?

    // 1. Invite User (Triggers creation and token generation)
    console.log(`\n1️⃣ Inviting user: ${email}...`)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: 'Bypass User' }
    })

    if (inviteError) {
        console.error('❌ Invite Failed:', inviteError)
        return
    }
    console.log('✅ Invite Sent/User Created!')

    // 2. Fetch Confirmation Token via RPC
    console.log('\n2️⃣ Fetching Token via RPC...')
    const { data: token, error: rpcError } = await supabaseAdmin.rpc('get_user_confirmation_token', {
        email_input: email
    })

    if (rpcError || !token) {
        console.error('❌ Failed to get token:', rpcError)
        return
    }
    console.log('✅ Token Retrieved:', token)

    // 3. Verify OTP to get Session
    console.log('\n3️⃣ Verifying OTP (type=invite) to get Session...')

    // Admin client can verify? Or Anon?
    // Supabase Admin verifyOtp might handle unchecked verification (no email matching)?
    // Docs say: verifyOtp({ ... })

    const { data: sessionData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
        email,
        token,
        type: 'invite' // CHANGE TO INVITE
    })

    if (verifyError) {
        console.error('❌ Verify Failed:', verifyError)
        // Fallback: Try with Anon Client? (Need to init new client)
    } else {
        console.log('✅ Verify Successful!')
        console.log('Session Access Token:', sessionData.session?.access_token ? 'YES' : 'NO')
        console.log('User ID:', sessionData.user?.id)
    }
}

debugInviteVerifyFlow()
