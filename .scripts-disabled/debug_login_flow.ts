
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs' // Use star import for safety with ts-node esm

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

// Read ANON KEY dynamically
let ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        const match = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)
        if (match) {
            ANON_KEY = match[1].trim().replace(/^["']|["']$/g, '') // remove quotes if any
        }
    }
} catch (e) { console.warn('Failed to read .env.local', e) }

if (!ANON_KEY) {
    console.error('❌ ANON_KEY is missing.')
    process.exit(1)
}

async function debugLoginFlow() {
    console.log('🚀 Starting Login Flow Debug...')

    // 1. Admin Client for RPC Creation
    const supabaseAdmin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // 2. Client for Login
    const supabaseClient = createClient(PROJECT_URL, ANON_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    const email = `test_login_${Date.now()}@example.com`
    // const email = 'cristianluke+v3@gmail.com'
    const password = 'Password123!'

    console.log(`\n1️⃣ Creating User via RPC: ${email}`)

    // Call RPC v2
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('create_auth_user_manual_v2', {
        email_input: email,
        password_plain_input: password,
        full_name_input: 'Login Test User'
    })

    if (rpcError) {
        console.error('❌ RPC Failed:', rpcError)
        return
    }
    console.log('✅ User Created:', rpcData)

    // 3. Attempt Login
    console.log('\n2️⃣ Attempting Client Login...')
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    })

    if (loginError) {
        console.error('❌ Login Failed:', loginError)
        console.error('Error Details:', JSON.stringify(loginError, null, 2))
    } else {
        console.log('✅ Login Successful!')
        console.log('Session ID:', loginData.session?.user.id)
    }
}

debugLoginFlow()
