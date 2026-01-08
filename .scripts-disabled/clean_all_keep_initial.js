const { createClient } = require('@supabase/supabase-js')

// Service Role Key for full access
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const PROTECTED_EMAIL = 'cristianluke@gmail.com'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function cleanDatabase() {
    console.log('🧹 Iniciando limpieza total (protegiendo usuario inicial)...\n')

    try {
        // 1. Get protected user ID
        const { data: protectedUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', PROTECTED_EMAIL)
            .single()

        if (!protectedUser) {
            console.error('❌ Usuario protegido no encontrado!')
            return
        }

        console.log(`✅ Usuario protegido: ${PROTECTED_EMAIL} (${protectedUser.id})`)

        // 2. Delete all invitations
        const { error: invError } = await supabase
            .from('invitations')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

        if (invError) console.error('⚠️ Error limpiando invitations:', invError.message)
        else console.log('✅ Invitaciones eliminadas')

        // 3. Delete all members EXCEPT protected user's super_admin membership
        const { data: protectedMembership } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', protectedUser.id)
            .eq('role_id', 'super_admin')
            .is('company_id', null)
            .maybeSingle()

        if (protectedMembership) {
            const { error: membersError } = await supabase
                .from('members')
                .delete()
                .neq('id', protectedMembership.id)

            if (membersError) console.error('⚠️ Error limpiando members:', membersError.message)
            else console.log(`✅ Miembros eliminados (conservando membership protegido: ${protectedMembership.id})`)
        } else {
            // Delete all members if no protected membership found
            const { error: membersError } = await supabase
                .from('members')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000')

            if (membersError) console.error('⚠️ Error limpiando members:', membersError.message)
            else console.log('✅ Miembros eliminados')
        }

        // 4. Delete all projects
        const { error: projError } = await supabase
            .from('projects')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (projError) console.error('⚠️ Error limpiando projects:', projError.message)
        else console.log('✅ Proyectos eliminados')

        // 5. Delete all companies
        const { error: compError } = await supabase
            .from('companies')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (compError) console.error('⚠️ Error limpiando companies:', compError.message)
        else console.log('✅ Empresas eliminadas')

        // 6. Delete from public.users table (except protected)
        const { error: usersError } = await supabase
            .from('users')
            .delete()
            .neq('id', protectedUser.id)

        if (usersError) console.error('⚠️ Error limpiando public.users:', usersError.message)
        else console.log('✅ Usuarios de tabla public.users eliminados')

        // 7. Delete from auth.users (CRITICAL - Uses Admin API)
        console.log('\n🔐 Limpiando auth.users (usuarios de autenticación)...')

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

        if (listError) {
            console.error('❌ Error listando usuarios:', listError.message)
            return
        }

        const usersToDelete = users.filter(u => u.email !== PROTECTED_EMAIL)

        console.log(`📋 Usuarios a eliminar: ${usersToDelete.length}`)

        for (const user of usersToDelete) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
            if (deleteError) {
                console.error(`   ❌ Error eliminando ${user.email}:`, deleteError.message)
            } else {
                console.log(`   ✅ Eliminado: ${user.email}`)
            }
        }

        console.log('\n✨ Limpieza completada exitosamente!')
        console.log(`\n📊 Estado Final:`)
        console.log(`   - Usuario protegido: ${PROTECTED_EMAIL}`)
        console.log(`   - Empresas: 0`)
        console.log(`   - Proyectos: 0`)
        console.log(`   - Usuarios adicionales: 0`)
        console.log(`   - Invitaciones: 0`)

    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

cleanDatabase()
