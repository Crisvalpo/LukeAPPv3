import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function main() {
    console.log('🚀 Bootstrapping Staff User...')

    const email = 'paoluke.webapp@gmail.com'
    const password = '123456' // Weak password, fine for demo/dev

    // 1. Create User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Pao Luke Staff' }
    })

    if (authError) {
        console.error('❌ Auth Error:', authError.message)
        // Check if user exists to proceed with role assignment if desired
    } else {
        console.log('✅ Auth User Created:', authUser.user.id)
    }

    const userId = authUser?.user?.id
    if (!userId) {
        // Try getting user if already exists
        const { data } = await supabase.from('profiles').select('id').eq('email', email).single()
        if (!data) return console.error('Could not find user ID.')
    }

    // 2. Ensure Company Exists (Constraint requires company_id)
    // We create a "System" company
    let companyId: string

    const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', 'lukeapp-hq')
        .single()

    if (existingCompany) {
        companyId = existingCompany.id
        console.log('ℹ️ Found existing company LukeAPP HQ')
    } else {
        const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: 'LukeAPP HQ',
                slug: 'lukeapp-hq',
                logo_url: 'https://lukeapp.com/logo.png'
            })
            .select()
            .single()

        if (companyError) {
            console.error('❌ Company Creation Error:', companyError.message)
            return
        }
        companyId = newCompany.id
        console.log('✅ Created Company LukeAPP HQ:', companyId)
    }

    // 3. Assign Role (Nivel 0 - Staff)
    // We insert into 'members' (from migration 0000)
    // Role 'super_admin' (must exist in roles table)

    // Ensure role exists first (idempotency)
    const { error: roleError } = await supabase
        .from('roles')
        .upsert({ id: 'super_admin', description: 'Platform Super Admin' })

    if (roleError) console.warn('Warning upserting role:', roleError.message)

    // Assign Member
    const { error: memberError } = await supabase
        .from('members')
        .upsert({
            user_id: userId,
            company_id: companyId,
            role_id: 'super_admin',
            project_id: null, // Global level
            status: 'ACTIVE'
        }, { onConflict: 'user_id, company_id, project_id, role_id' })

    if (memberError) {
        console.error('❌ Member Assignment Error:', memberError.message)
    } else {
        console.log('✅ User assigned as super_admin successfully!')
    }
}

main()
