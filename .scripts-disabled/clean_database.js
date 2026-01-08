const { createClient } = require('@supabase/supabase-js')

// Read from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_ACCESS_TOKEN

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_ACCESS_TOKEN')
    console.error('\nEjecuta: set NEXT_PUBLIC_SUPABASE_URL=tu_url')
    console.error('         set SUPABASE_ACCESS_TOKEN=tu_token')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanDatabase() {
    console.log('🧹 Limpiando base de datos...\n')

    try {
        // 1. Delete invitations
        console.log('1️⃣ Eliminando invitaciones...')
        const { error: invError } = await supabase
            .from('invitations')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

        if (invError) throw invError
        console.log('   ✅ Invitaciones eliminadas\n')

        // 2. Get Staff user to keep
        console.log('2️⃣ Identificando usuario Staff...')
        const { data: staffMember } = await supabase
            .from('members')
            .select('id, user_id')
            .eq('role_id', 'super_admin')
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        if (!staffMember) {
            console.error('❌ No se encontró ningún usuario Staff')
            process.exit(1)
        }
        console.log('   ✅ Staff user ID:', staffMember.user_id, '\n')

        // 3. Delete all members except Staff
        console.log('3️⃣ Eliminando miembros (excepto Staff)...')
        const { error: membersError } = await supabase
            .from('members')
            .delete()
            .neq('id', staffMember.id)

        if (membersError) throw membersError
        console.log('   ✅ Miembros eliminados\n')

        // 4. Delete projects
        console.log('4️⃣ Eliminando proyectos...')
        const { error: projError } = await supabase
            .from('projects')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (projError) throw projError
        console.log('   ✅ Proyectos eliminados\n')

        // 5. Delete companies
        console.log('5️⃣ Eliminando empresas...')
        const { error: compError } = await supabase
            .from('companies')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (compError) throw compError
        console.log('   ✅ Empresas eliminadas\n')

        // 6. Delete users (except Staff)
        console.log('6️⃣ Eliminando usuarios (excepto Staff)...')
        const { error: usersError } = await supabase
            .from('users')
            .delete()
            .neq('id', staffMember.user_id)

        if (usersError) throw usersError
        console.log('   ✅ Usuarios eliminados\n')

        // 7. Verify clean state
        console.log('📊 Verificando estado final...\n')

        const tables = ['companies', 'projects', 'members', 'invitations', 'users']
        for (const table of tables) {
            const { count } = await supabase
                .from(table)
                .select('id', { count: 'exact', head: true })

            console.log(`   ${table.padEnd(15)} → ${count} registros`)
        }

        // Show remaining staff
        console.log('\n👤 Usuario Staff restante:')
        const { data: staffUser } = await supabase
            .from('users')
            .select('email')
            .eq('id', staffMember.user_id)
            .single()

        console.log(`   📧 ${staffUser?.email}`)
        console.log(`   🔑 Rol: super_admin`)

        console.log('\n✅ Base de datos limpia y lista para pruebas!\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    }
}

cleanDatabase()
