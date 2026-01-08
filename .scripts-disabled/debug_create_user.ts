
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

async function debugCreateUser() {
    console.log('🚀 Starting Admin User Creation Debug...')

    if (!SERVICE_ROLE_KEY) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot proceed with admin creation.')
        return
    }

    const supabaseAdmin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const email = 'cristianluke@gmail.com'
    const password = 'Password123!' // Temp password

    // 1. Check if user exists
    console.log(`\n🔍 Checking if ${email} exists...`)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
        console.error('❌ Error listing users:', listError)
        return
    }

    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
        console.log(`⚠️ User found! ID: ${existingUser.id}`)
        console.log('Status:', existingUser.confirmed_at ? 'Confirmed' : 'Unconfirmed')

        // Delete it to test creation?
        console.log('🗑️ Deleting existing user to retry fresh creation...')
        const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
        if (delError) {
            console.error('❌ Error deleting user:', delError)
            return
        }
        console.log('✅ User deleted.')
    } else {
        console.log('✅ User not found (Clean state).')
    }

    // 2. Attempt Creation
    console.log('\n✨ Attempting Admin CreateUser...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for this test? Or should we test the email flow?
        // User wanted email validation. But let's check if DB blocks insertion first.
        // We will try auto-confirm first to rule out "Email Sending" errors.
        user_metadata: {
            full_name: 'Cristian Luke'
        }
    })

    if (createError) {
        console.error('❌ FATAL ERROR Creating User:', createError)
        console.error('Error Details:', JSON.stringify(createError, null, 2))
    } else {
        console.log('✅ User Created Successfully via Admin!')
        console.log('User ID:', newUser.user.id)
        console.log('Confirmation:', newUser.user.confirmation_sent_at)
    }
}

debugCreateUser()
