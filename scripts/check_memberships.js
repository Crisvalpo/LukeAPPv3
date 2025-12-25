const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://rvgrhtqxzfcypbfxqilp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
)

async function check() {
    console.log('=== VERIFICACION DE PROYECTOS Y MEMBERSHIPS ===\n')

    const { data: projects } = await supabase
        .from('projects')
        .select('name, code, company_id, companies(name)')

    console.log('Proyectos:', projects?.length || 0)
    if (projects) {
        projects.forEach(p => {
            console.log(`  - ${p.name} (${p.code}) - Empresa: ${p.companies?.name}`)
        })
    }

    const { data: members } = await supabase
        .from('members')
        .select('users(email), role_id, companies(name), projects(name)')
        .neq('role_id', 'super_admin')

    console.log('\nMemberships (no staff):')
    if (members) {
        members.forEach(m => {
            const project = m.projects ? ` / Proyecto: ${m.projects.name}` : ''
            console.log(`  - ${m.users?.email}: ${m.role_id} en ${m.companies?.name}${project}`)
        })
    }

    const { data: invitations } = await supabase
        .from('invitations')
        .select('email, role_id, status, companies(name), projects(name)')
        .order('created_at', { ascending: false })
        .limit(5)

    console.log('\nUltimas invitaciones:')
    if (invitations) {
        invitations.forEach(i => {
            const project = i.projects ? ` / ${i.projects.name}` : ''
            console.log(`  - ${i.email}: ${i.role_id} (${i.status}) - ${i.companies?.name}${project}`)
        })
    }
}

check()
