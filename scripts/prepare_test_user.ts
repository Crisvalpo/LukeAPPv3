
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function prepareTestUser() {
    console.log('🔍 Finding test user (Founder)...')

    // Find a founder member
    const { data: members, error } = await supabase
        .from('members')
        .select(`
            user_id,
            users (
                id,
                email
            )
        `)
        .eq('role_id', 'founder')
        .limit(1)
        .single()

    if (error || !members || !members.users) {
        console.error('❌ Error finding founder:', error)
        return
    }

    const { email, id } = members.users
    console.log(`👤 Found User: ${email}`)

    // Update password to ensure we can login
    const { error: updateError } = await supabase.auth.admin.updateUserById(
        id,
        { password: 'password123' }
    )

    if (updateError) {
        console.error('❌ Error updating password:', updateError)
    } else {
        console.log('✅ Password set to: password123')
        console.log('🚀 Ready for browser testing')
    }
}

prepareTestUser()
