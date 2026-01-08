import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function check() {
    console.log('🔍 Checking User Status...')

    // 1. Get Auth User
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === 'paoluke.webapp@gmail.com')

    if (!user) return console.error('❌ User not found in Auth!')
    console.log('✅ User Found:', user.id)

    // 2. Check Member Entry
    const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (memberError) {
        console.error('❌ Member Lookup Error:', memberError.message)
    } else {
        console.log('✅ Member Found:', member)
        console.log('   Role ID:', member.role_id)
    }

    // 3. Check Role Definition
    const { data: role } = await supabase
        .from('roles')
        .select('*')
        .eq('id', member?.role_id)
        .single()

    console.log('ℹ️ Role Definition:', role)
}

check()
