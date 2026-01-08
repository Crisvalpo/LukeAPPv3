
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabaseAdmin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function debugMagicLink() {
    console.log('🚀 Debugging Magic Link Generation...')
    const email = 'test_server_1@example.com' // Already created user

    // 1. Generate Magic Link
    console.log(`Generating link for ${email}...`)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email
    })

    if (error) {
        console.error('❌ Generate Link Failed:', error)
    } else {
        console.log('✅ Link Generated!')
        console.log('Action Link:', data.properties?.action_link)
        console.log('User ID:', data.user?.id)

        // Is there a session? No, generateLink just gives a link.
        // We can verify the OTP manually to get a session?
        // extract token from link?
        // Link format: .../verify?token=...&type=magiclink&redirect_to=...
        const link = data.properties?.action_link
        const tokenMatch = link?.match(/token=([^&]+)/)
        if (tokenMatch) {
            const token = tokenMatch[1]
            console.log('extracted token:', token)

            // 2. Verify OTP as Client?
            // (Need Anon Key, but we can try verifying as Admin? No, verifyOtp is client method usually, but verifyOTP exists on admin too?)
            // Admin doesn't have verifyOtp? Check docs.
            // Admin can delete/update user.
            // But we can simulate client verification with just the Token?
            // Actually, we want the USER to eventually get a session.
            // We can return the Access Token if we can verify it.

            // Let's rely on standard client verify logic.
        }
    }
}

debugMagicLink()
