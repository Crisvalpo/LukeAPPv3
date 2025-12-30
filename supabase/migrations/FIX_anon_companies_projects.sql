-- El problema es que validateInvitationToken hace LEFT JOIN con companies y projects
-- Esas tablas también necesitan políticas RLS para 'anon'

-- Verificar RLS en companies y projects
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('companies', 'projects');

-- Ver políticas existentes
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('companies', 'projects')
ORDER BY tablename, policyname;

-- Crear políticas para permitir a 'anon' leer companies y projects
-- (solo para mostrar info básica en la página de invitación)

CREATE POLICY "Allow anon to read company names for invitations"
ON public.companies
FOR SELECT
TO anon
USING (true);  -- Permite leer nombre de cualquier empresa (info pública)

CREATE POLICY "Allow anon to read project names for invitations"
ON public.projects  
FOR SELECT
TO anon
USING (true);  -- Permite leer nombre de cualquier proyecto (info pública)

-- Verificar políticas creadas
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('companies', 'projects') AND 'anon' = ANY(roles)
ORDER BY tablename;
