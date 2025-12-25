const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://rvgrhtqxzfcypbfxqilp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
)

async function checkPaoluke() {
    console.log('=== Estado de paoluke.webapp@gmail.com ===\n')

    // Get user
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === 'paoluke.webapp@gmail.com')

    if (!user) {
        console.log('❌ Usuario no encontrado')
        return
    }

    console.log('✅ Usuario encontrado')
    console.log('ID:', user.id)
    console.log('Email confirmado:', user.email_confirmed_at ? 'SI' : 'NO')

    // Get memberships
    const { data: members, error } = await supabase
        .from('members')
        .select('id, role_id, company_id, project_id, companies(name), projects(name)')
        .eq('user_id', user.id)

    console.log('\nMemberships:', members?.length || 0)
    if (members && members.length > 0) {
        members.forEach(m => {
            console.log(`- ${m.role_id} en ${m.companies?.name}${m.projects ? ` / ${m.projects.name}` : ''}`)
        })
    } else {
        console.log('Sin memberships')
        if (error) console.log('Error:', error.message)
    }

    // Get invitations
    const { data: invitations } = await supabase
        .from('invitations')
        .select('status, role_id')
        .eq('email', 'paoluke.webapp@gmail.com')
        .order('created_at', { ascending: false })
        .limit(1)

    if (invitations && invitations.length > 0) {
        console.log('\nInvitación:', invitations[0].status, `(${invitations[0].role_id})`)
    }
}

checkPaoluke()
