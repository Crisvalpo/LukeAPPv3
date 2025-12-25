const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
-- 1. LIMPIEZA DE POLICIES (NUCLEAR OPTION)
DROP POLICY IF EXISTS "Public read access roles" ON public.roles;
DROP POLICY IF EXISTS "Read own profile" ON public.users;
DROP POLICY IF EXISTS "Staff read all profiles" ON public.users;
DROP POLICY IF EXISTS "Update own profile" ON public.users;
DROP POLICY IF EXISTS "Staff full access companies" ON public.companies;
DROP POLICY IF EXISTS "Founder read own company" ON public.companies;
DROP POLICY IF EXISTS "Founders can select their company" ON public.companies; -- Zombie killer
DROP POLICY IF EXISTS "Founders can update their company" ON public.companies; -- Zombie killer
DROP POLICY IF EXISTS "Members can view their company" ON public.companies; -- Zombie killer
DROP POLICY IF EXISTS "Super admins can delete companies" ON public.companies; -- Zombie killer
DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies; -- Zombie killer
DROP POLICY IF EXISTS "Super admins can select all companies" ON public.companies; -- Zombie killer
DROP POLICY IF EXISTS "Super admins can update companies" ON public.companies; -- Zombie killer
DROP POLICY IF EXISTS "Staff full access projects" ON public.projects;
DROP POLICY IF EXISTS "Founder full access projects" ON public.projects;
DROP POLICY IF EXISTS "Member read assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Staff full access members" ON public.members;
DROP POLICY IF EXISTS "Founder manage company members" ON public.members;
DROP POLICY IF EXISTS "Read own membership" ON public.members;
DROP POLICY IF EXISTS "Staff full access invitations" ON public.invitations;
DROP POLICY IF EXISTS "Founder manage invitations" ON public.invitations;
-- y limpiamos cualquier otra policy que pudiera existir en estas tablas
DROP POLICY IF EXISTS "Users can view own memberships" ON public.members;
DROP POLICY IF EXISTS "Founders can create projects for their company" ON public.projects;
DROP POLICY IF EXISTS "Founders can delete their company projects" ON public.projects; 
DROP POLICY IF EXISTS "Founders can update their company projects" ON public.projects;
DROP POLICY IF EXISTS "Founders can view their company projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view their company projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can update all projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view assigned projects" ON public.projects;


-- 2. APLICAR POLICIES LIMPIAS (Del 0000_fase1_foundation.sql)

-- ROLES
CREATE POLICY "Public read access roles" ON public.roles FOR SELECT USING (true);

-- USERS
CREATE POLICY "Read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff read all profiles" ON public.users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
CREATE POLICY "Update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- COMPANIES
CREATE POLICY "Staff full access companies" ON public.companies FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
CREATE POLICY "Founder read own company" ON public.companies FOR SELECT USING (
    id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);

-- PROJECTS
CREATE POLICY "Staff full access projects" ON public.projects FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
CREATE POLICY "Founder full access projects" ON public.projects FOR ALL USING (
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);
CREATE POLICY "Member read assigned projects" ON public.projects FOR SELECT USING (
    id IN (SELECT project_id FROM public.members WHERE user_id = auth.uid()) 
    OR 
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND project_id IS NULL)
);

-- MEMBERS
CREATE POLICY "Staff full access members" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
CREATE POLICY "Founder manage company members" ON public.members FOR ALL USING (
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);
CREATE POLICY "Read own membership" ON public.members FOR SELECT USING (user_id = auth.uid());

-- INVITATIONS
CREATE POLICY "Staff full access invitations" ON public.invitations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
CREATE POLICY "Founder manage invitations" ON public.invitations FOR ALL USING (
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);
CREATE POLICY "Read own invitation by email" ON public.invitations FOR SELECT USING (
    email = (select auth.jwt() ->> 'email')
);
`

async function executeSQLDirect() {
    console.log('🧹 Limpiando policies zombies y aplicando esquema limpio...\n')

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        console.log('✅ Base de datos saneada y lista para pruebas.')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
