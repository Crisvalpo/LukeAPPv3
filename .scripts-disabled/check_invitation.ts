import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function checkInvitation() {
    console.log('🔍 Verificando invitación para test@founder.com\n')

    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', 'test@founder.com')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('❌ Error:', error)
        return
    }

    console.log('📋 Invitación encontrada:')
    console.log('  Email:', data.email)
    console.log('  Token:', data.token)
    console.log('  Status:', data.status)
    console.log('  Created:', new Date(data.created_at).toLocaleString())
    console.log('  Expires:', new Date(data.expires_at).toLocaleString())
    console.log('  Expired?', new Date(data.expires_at) < new Date())
    console.log('\n🔗 Link:')
    console.log(`http://localhost:3000/invitations/accept/${data.token}`)
}

checkInvitation()
