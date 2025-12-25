const { createClient } = require('@supabase/supabase-js')

// ⚠️ WARNING: THIS KEY HAS FULL ADMIN ACCESS
// Extracted from bootstrap_admin.ts for consistency
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function main() {
    console.log('🚀 Seeding Initial Staff User (Cristian Luke)...')

    const userData = {
        email: 'cristianluke@gmail.com',
        password: '123456',
        full_name: 'Cristian Luke' // Staff Name
    }

    // 1. Create or Get User (Auth)
    let userId

    // Try creating
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { full_name: userData.full_name }
    })

    if (!createError && createdUser?.user) {
        console.log('✅ Auth User Created:', createdUser.user.id)
        userId = createdUser.user.id
    } else {
        // If error is "User already registered", fetch it
        console.log('ℹ️ User might already exist, fetching ID...')
        // Admin listUsers to find by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) return console.error('❌ Error listing users:', listError.message)

        const existing = users.find(u => u.email === userData.email)
        if (existing) {
            userId = existing.id
            console.log('✅ Found existing Auth User:', userId)
        } else {
            console.error('❌ Could not create or find user:', createError?.message)
            return
        }
    }

    // 1.1 Ensure entry in public.users (Trigger usually handles this, but let's be safe/idempotent)
    const { error: profileError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: null
        })

    if (profileError) console.warn('⚠️ Profile upsert warning (trigger might have handled it):', profileError.message)
    else console.log('✅ Public Profile ensured.')


    // 2. Create System Company (LukeAPP HQ)
    let companyId
    const companySlug = 'lukeapp-hq'

    const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', companySlug)
        .single()

    if (existingCompany) {
        companyId = existingCompany.id
        console.log('ℹ️ Existing Company Found:', companyId)
    } else {
        const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: 'LukeAPP HQ',
                slug: companySlug
            })
            .select() // Returns array
            .single()

        if (companyError) {
            console.error('❌ Company Creation Error:', companyError.message)
            return
        }
        companyId = newCompany.id
        console.log('✅ Created Company LukeAPP HQ:', companyId)
    }

    // 3. Assign Role (super_admin)
    // We don't need to upsert roles table if we assume migration 0000 created enum or table.
    // Based on bootstrap code, roles are in a table? Let's check bootstrap again.
    // bootstrap_admin.ts lines 78-80 upserts 'roles'. Let's do that too to be safe.

    /* 
       Note: The user instructions mentioned schema changes. 
       If 'role_id' is an ENUM in DB, we can't upsert into a 'roles' table unless it exists.
       Checking types/index.ts: export type UserRoleType = ... 'super_admin'
       Checking bootstrap_admin.ts: It tries to upsert into 'roles'. So 'roles' table exists.
    */

    // Ensure role definition
    /*
    const { error: roleErr } = await supabase
        .from('roles')
        .upsert({ id: 'super_admin', description: 'Super Admin' })
    if (roleErr) console.warn('⚠️ Role upsert warning (might be enum or table):', roleErr.message)
    */
    // Slipped check: Types file says "UserRole" is string values. 
    // If database uses a foreign key to a roles table, we need the record.
    // If it uses just strings/enum, we don't.
    // I will try to assign directly. If FK fails, I will know.

    const { error: memberError } = await supabase
        .from('members')
        .upsert({
            user_id: userId,
            company_id: companyId,
            role_id: 'super_admin', // As per types/index.ts
            project_id: null, // super_admin is global usually, or company level? 
            // Staff users might need null project_id? 
            // bootstrap_admin.ts used project_id: null
        }, { onConflict: 'user_id, company_id, project_id, role_id' })

    if (memberError) {
        console.error('❌ Member Assignment Error:', memberError.message)
        // If error mentions fk violation on role, we might need to insert role.
    } else {
        console.log('✅ SUCCESS: Cristian Luke is now a Super Admin of LukeAPP HQ')
    }
}

main()
