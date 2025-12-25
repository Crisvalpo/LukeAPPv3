import { createClient } from '@supabase/supabase-js'

// Using Service Role for Setup, Anon for Testing
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDgyMjEsImV4cCI6MjA4MjA4NDIyMX0.pqeQkyGrK_EWx28OSR6eaph9Vdg1kzdUiNZe3wKtrT8'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const adminClient = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function setupAndTest() {
    console.log('🧪 Starting Role System Verification...')
    const password = '123456'

    // 1. Ensure Roles Exist in DB
    const roles = ['founder', 'admin', 'supervisor', 'worker']
    for (const r of roles) {
        await adminClient.from('roles').upsert({ id: r, description: `Test role ${r}` })
    }

    // 2. Create Test Company & Project
    const { data: company } = await adminClient.from('companies').insert({ name: 'Test Corp', slug: 'test-corp' }).select().single()
        || await adminClient.from('companies').select().eq('slug', 'test-corp').single()

    if (!company) throw new Error('Failed to get/create company')

    const { data: project } = await adminClient.from('projects').insert({
        company_id: company.id, name: 'Test Project A', code: 'TPA', status: 'ACTIVE'
    }).select().single()
        || await adminClient.from('projects').select().eq('code', 'TPA').single()

    // 3. Create & Test Users
    const testCases = [
        { role: 'founder', expectedAccess: true },
        { role: 'supervisor', expectedAccess: true },
        { role: 'worker', expectedAccess: true } // Worker allows login, but restricted nav
    ]

    for (const test of testCases) {
        const email = `test.${test.role}@lukeapp.com`
        console.log(`\n👤 Testing User: ${email} (${test.role})`)

        // A. Create/Get User
        let userId: string
        const { data: users } = await adminClient.auth.admin.listUsers()
        const existing = users.users.find(u => u.email === email)

        if (existing) {
            userId = existing.id
        } else {
            const { data: created } = await adminClient.auth.admin.createUser({
                email, password, email_confirm: true, user_metadata: { full_name: `Test ${test.role}` }
            })
            if (!created.user) { console.error('Failed to create user'); continue }
            userId = created.user.id
        }

        // B. Assign Role
        const { error: assignError } = await adminClient.from('members').upsert({
            user_id: userId,
            company_id: company.id,
            project_id: project?.id,
            role_id: test.role,
            status: 'ACTIVE'
        }, { onConflict: 'user_id, company_id, project_id, role_id' })

        if (assignError) console.error('  ❌ Role Assignment Failed:', assignError.message)
        else console.log('  ✅ Role Assigned')

        // C. Simulate Login (Client Check)
        const userClient = createClient(PROJECT_URL, ANON_KEY)
        const { error: loginError } = await userClient.auth.signInWithPassword({ email, password })

        if (loginError) {
            console.error('  ❌ Login Failed:', loginError.message)
            continue
        }

        // D. Verify RLS (Can I read my own member record?)
        const { data: member, error: rlsError } = await userClient
            .from('members')
            .select('role_id')
            .eq('user_id', userId)
            .single()

        if (rlsError) {
            console.error('  ❌ RLS Check Failed (Middleware will break):', rlsError.message)
        } else if (member.role_id === test.role) {
            console.log('  ✅ RLS Check Passed: User can read their role.')
        } else {
            console.error('  ❌ Role Mismatch:', member.role_id)
        }
    }
}

setupAndTest()
