const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
-- 1. Create Helper Security Definer Functions to break recursion
-- These functions run with OWNER privileges, bypassing RLS on 'members'

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members 
    WHERE user_id = auth.uid() 
    AND role_id = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_founder_companies()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.members 
  WHERE user_id = auth.uid() 
  AND role_id = 'founder';
$$;

-- 2. Drop existing recursive policies on members

DROP POLICY IF EXISTS "Staff full access members" ON public.members;
DROP POLICY IF EXISTS "Founder manage company members" ON public.members;
DROP POLICY IF EXISTS "Read own membership" ON public.members;

-- 3. Re-create policies using the safe functions

-- Staff can do everything (using function to avoid recursion)
CREATE POLICY "Staff full access members" ON public.members 
FOR ALL 
USING ( public.is_super_admin() );

-- Founders can view/edit members of their companies (using function)
CREATE POLICY "Founder manage company members" ON public.members 
FOR ALL 
USING ( 
    company_id IN (SELECT public.get_my_founder_companies()) 
);

-- Users can read their own membership
-- (This one is usually safe as user_id = auth.uid() doesn't need a table scan of others, 
-- but consistent to keep it simple)
CREATE POLICY "Read own membership" ON public.members 
FOR SELECT 
USING ( user_id = auth.uid() );

-- 4. Update other tables that rely on members to ensure they use the functions too 
-- (Optional but safer / more performant)

-- COMPANIES
DROP POLICY IF EXISTS "Staff full access companies" ON public.companies;
CREATE POLICY "Staff full access companies" ON public.companies 
FOR ALL 
USING ( public.is_super_admin() );

DROP POLICY IF EXISTS "Founder read own company" ON public.companies;
CREATE POLICY "Founder read own company" ON public.companies 
FOR SELECT 
USING (
    id IN (SELECT public.get_my_founder_companies())
);

-- PROJECTS
DROP POLICY IF EXISTS "Staff full access projects" ON public.projects;
CREATE POLICY "Staff full access projects" ON public.projects 
FOR ALL 
USING ( public.is_super_admin() );

DROP POLICY IF EXISTS "Founder full access projects" ON public.projects;
CREATE POLICY "Founder full access projects" ON public.projects 
FOR ALL 
USING (
    company_id IN (SELECT public.get_my_founder_companies())
);

-- INVITATIONS
DROP POLICY IF EXISTS "Staff full access invitations" ON public.invitations;
CREATE POLICY "Staff full access invitations" ON public.invitations 
FOR ALL 
USING ( public.is_super_admin() );

DROP POLICY IF EXISTS "Founder manage invitations" ON public.invitations;
CREATE POLICY "Founder manage invitations" ON public.invitations 
FOR ALL 
USING (
    company_id IN (SELECT public.get_my_founder_companies())
);

-- USERS
-- Staff read all profiles
DROP POLICY IF EXISTS "Staff read all profiles" ON public.users;
CREATE POLICY "Staff read all profiles" ON public.users 
FOR SELECT 
USING ( public.is_super_admin() );

`

async function executeSQLDirect() {
    console.log('🧹 Eliminando recursión infinita en Policies...\n')

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

        console.log('✅ Functions Security Definer creadas y Policies actualizadas.')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
