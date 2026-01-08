const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
-- RLS Policies for Companies table

-- Enable RLS
alter table public.companies enable row level security;

-- Super admins can do everything
create policy "Super admins can insert companies"
  on public.companies
  for insert
  with check (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );

create policy "Super admins can select all companies"
  on public.companies
  for select
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );

create policy "Super admins can update companies"
  on public.companies
  for update
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );

-- Founders can view and update their own company
create policy "Founders can select their company"
  on public.companies
  for select
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.company_id = companies.id
      and members.role_id = 'founder'
    )
  );

create policy "Founders can update their company"
  on public.companies
  for update
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.company_id = companies.id
      and members.role_id = 'founder'
    )
  );

-- Everyone can see companies they're members of
create policy "Members can view their company"
  on public.companies
  for select
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.company_id = companies.id
    )
  );
`

async function executeSQLDirect() {
    console.log('🔧 Aplicando RLS policies para companies...\n')

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        })

        const result = await response.text()

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}:`, result)
            throw new Error(result)
        }

        console.log('✅ RLS policies para companies aplicadas exitosamente!')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
