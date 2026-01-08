
const { createClient } = require('@supabase/supabase-js')

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function confirmUser(email) {
    console.log(`🔍 Buscando usuario: ${email}`)

    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error('❌ Error listando usuarios:', error)
        return
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
        console.error('❌ Usuario no encontrado. Asegúrate de haber completado el registro en el navegador primero.')
        return
    }

    console.log(`✅ Usuario encontrado: ${user.id}`)

    if (user.email_confirmed_at) {
        console.log('✨ El email ya estaba confirmado.')
        return
    }

    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    )

    if (updateError) {
        console.error('❌ Error confirmando email:', updateError)
    } else {
        console.log('🚀 Email confirmado exitosamente via Admin API')
    }
}

// Get email from args or default
const email = process.argv[2] || 'founder_test@lukeapp.com'
confirmUser(email)
