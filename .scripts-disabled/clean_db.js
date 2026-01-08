// Clean database using Supabase Management API
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = process.env.PROJECT_REF

if (!ACCESS_TOKEN || !PROJECT_REF) {
    console.error('❌ Configura las variables de entorno:')
    console.error('   set SUPABASE_ACCESS_TOKEN=sbp_xxx')
    console.error('   set PROJECT_REF=xxxxx')
    process.exit(1)
}

const cleanSQL = `
DO $$
DECLARE
    staff_user_id UUID;
    staff_member_id UUID;
BEGIN
    SELECT id, user_id INTO staff_member_id, staff_user_id
    FROM public.members 
    WHERE role_id = 'super_admin' 
    ORDER BY created_at ASC 
    LIMIT 1;

    DELETE FROM public.invitations;
    DELETE FROM public.members WHERE id != staff_member_id;
    DELETE FROM public.projects;
    DELETE FROM public.companies;
    DELETE FROM public.users WHERE id != staff_user_id;
END $$;

SELECT 'companies' as table_name, COUNT(*) as count FROM public.companies
UNION ALL SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL SELECT 'members', COUNT(*) FROM public.members
UNION ALL SELECT 'invitations', COUNT(*) FROM public.invitations
UNION ALL SELECT 'users', COUNT(*) FROM public.users;
`

async function clean() {
    console.log('🧹 Limpiando...\n')

    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: cleanSQL })
    })

    if (!res.ok) {
        console.error('❌ Error:', await res.text())
        process.exit(1)
    }

    const data = await res.json()
    console.log('✅ Limpio!\n')
    data.forEach(r => console.log(`${r.table_name}: ${r.count}`))
}

clean()
