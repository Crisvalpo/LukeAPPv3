import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'
// Hardcoded ANON Key as retrieving from env failed
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDgyMjEsImV4cCI6MjA4MjA4NDIyMX0.pqeQkyGrK_EWx28OSR6eaph9Vdg1kzdUiNZe3wKtrT8'

const supabase = createClient(PROJECT_URL, ANON_KEY)

async function check() {
    console.log('🔍 Checking User Access (RLS Simulation)...')

    // 1. Login
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'paoluke.webapp@gmail.com',
        password: '123456'
    })

    if (loginError || !session) return console.error('❌ Login Failed:', loginError?.message)
    console.log('✅ Logged in as:', session.user.id)

    // 2. Check Member Entry (As User)
    const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

    if (memberError) {
        console.error('❌ Member Lookup Error (RLS Blocked?):', memberError.message)
        console.error('   Details:', memberError.details)
        console.error('   Code:', memberError.code)
    } else {
        console.log('✅ Member Found:', member)
        console.log('   Role ID:', member.role_id)
    }
}

check()
