const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'

const SQL = `
-- Habilitar RLS en companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Staff full access companies" ON public.companies;
DROP POLICY IF EXISTS "Members view own company" ON public.companies;

-- 1. Staff (Super Admin) puede hacer todo
CREATE POLICY "Staff full access companies"
ON public.companies
TO authenticated
USING (
  public.is_super_admin()
)
WITH CHECK (
  public.is_super_admin()
);

-- 2. Miembros pueden ver su propia empresa
CREATE POLICY "Members view own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.company_id = companies.id
    AND members.user_id = auth.uid()
  )
);
`

async function fixPolicies() {
    console.log('🔧 Aplicando políticas RLS para companies...\n')

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: SQL })
        })

        if (response.ok) {
            console.log('✅ Políticas aplicadas exitosamente')
        } else {
            const error = await response.text()
            console.error('❌ Error:', error)
        }

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

fixPolicies()
