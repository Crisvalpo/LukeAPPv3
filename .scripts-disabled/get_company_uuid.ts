import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function getCompanyUUID() {
    const { data: company } = await supabase
        .from('companies')
        .select('id, name, slug')
        .eq('slug', 'lukeapp-hq')
        .single()

    if (company) {
        console.log('✅ Company Found:')
        console.log(`   Name: ${company.name}`)
        console.log(`   Slug: ${company.slug}`)
        console.log(`   UUID: ${company.id}`)
        console.log('\nSQL Query to use:')
        console.log(`insert into members (user_id, role_id, company_id, status) values ('f8ed607d-7c07-4548-a0ae-b779183ddf38', 'super_admin', '${company.id}', 'ACTIVE');`)
    } else {
        console.error('❌ Company not found')
    }
}

getCompanyUUID()
