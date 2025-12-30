-- Verificar RLS en invitations
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'invitations';

-- Ver políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'invitations';

-- Crear política RLS para permite a 'anon' leer invitaciones pendientes
CREATE POLICY "Allow anon to read pending invitations"
ON public.invitations
FOR SELECT
TO anon
USING (status = 'pending');

-- Verificar política creada
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'invitations';
