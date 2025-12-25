const { createClient } = require('@supabase/supabase-js')

// Credentials from previous scripts
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function checkUserStatus() {
    console.log('🔍 Checking user verification status...')

    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error('❌ Error fetching users:', error)
        return
    }

    const cristian = users.find(u => u.email === 'cristianluke@gmail.com')

    if (cristian) {
        console.log('\n👤 User Found:')
        console.log('   Email:', cristian.email)
        console.log('   ID:', cristian.id)
        console.log('   Confirmed At:', cristian.email_confirmed_at || '❌ NOT CONFIRMED')
        console.log('   Last Sign In:', cristian.last_sign_in_at)

        if (cristian.email_confirmed_at) {
            console.log('\n✅ El usuario YA está verificado (email_confirmed_at existe).')
        } else {
            console.log('\n⚠️ El usuario NO está verificado. Intentando verificar manualmente...')
            const { data, error: updateError } = await supabase.auth.admin.updateUserById(
                cristian.id,
                { email_confirm: true }
            )
            if (updateError) console.error('   ❌ Failed to force verify:', updateError.message)
            else console.log('   ✅ Forzosa verificación exitosa.')
        }

    } else {
        console.log('❌ User queries not found.')
    }
}

checkUserStatus()
