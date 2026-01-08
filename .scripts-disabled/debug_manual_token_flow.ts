
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

// We need valid ANON KEY for client-side verifyOtp
const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || PROJECT_URL
// Hopefully these are set in environment when running, if not we might fail client step.
// We'll trust the environment or hardcode if needed (user provided some previously)

const supabaseAdmin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function debugManualTokenFlow() {
    console.log('🚀 Debugging Manual Token Injection Flow...')
    const email = `test_token_${Date.now()}@example.com`
    const password = 'Password123!'
    const manualToken = '123456'

    // 1. Create User (RPC v2)
    console.log(`\n1️⃣ Creating User: ${email}`)
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('create_auth_user_manual_v2', {
        email_input: email,
        password_plain_input: password,
        full_name_input: 'Token Test User'
    })

    if (rpcError) {
        console.error('❌ Create Failed:', rpcError)
        return
    }
    console.log('✅ User Created.')

    // 2. Inject Manual Token
    console.log(`\n2️⃣ Injecting Token: ${manualToken}`)
    const { error: injectError } = await supabaseAdmin.rpc('set_user_token', {
        email_input: email,
        token_input: manualToken
    })

    if (injectError) {
        console.error('❌ Token Injection Failed:', injectError)
        return
    }
    console.log('✅ Token Set.')

    // 3. Verify OTP (Simulate Client)
    console.log(`\n3️⃣ Verifying OTP...`)
    // We can use supabaseAdmin.auth.verifyOtp to test if it generates a session.
    // In production we might want the CLIENT to do this.
    // Let's try admin first.

    const { data: sessionData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
        email,
        token: manualToken,
        type: 'signup'
        // Note: RPC set 'confirmation_token', which corresponds to 'signup' or 'email' verification.
        // If user is already confirmed (RPC confirms them?), then 'signup' might fail if checking 'email_confirmed_at'?
        // RPC v2 sets 'email_confirmed_at = now()'.
        // If verified, maybe we need 'magiclink' or 'recovery'?
        // 'confirmation_token' is usually for Email Confirmation.
        // If user is ALREADY confirmed, verifyOtp(signup) might say "already confirmed".
        // Let's see. 
    })

    if (verifyError) {
        console.error('❌ Verify Failed:', verifyError)

        // Retry with recovery?
        console.log('--- Retrying with type=recovery ---')
        const { data: recData, error: recError } = await supabaseAdmin.auth.verifyOtp({
            email,
            token: manualToken,
            type: 'recovery' // RPC set recovery_token too
        })

        if (recError) {
            console.error('❌ Recovery Verify Failed:', recError)
        } else {
            console.log('✅ Recovery Verify Success!')
            console.log('Session:', recData.session?.access_token ? 'YES' : 'NO')
        }

    } else {
        console.log('✅ Verify Success!')
        console.log('Session:', sessionData.session?.access_token ? 'YES' : 'NO')
        console.log('User:', sessionData.user?.id)
    }
}

debugManualTokenFlow()
