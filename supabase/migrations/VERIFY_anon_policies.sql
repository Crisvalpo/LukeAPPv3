-- Verificar que las políticas para 'anon' existan y estén activas
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles::text,
    cmd,
    qual::text as condition
FROM pg_policies
WHERE tablename IN ('invitations', 'companies', 'projects')
  AND roles::text LIKE '%anon%'
ORDER BY tablename, policyname;

-- Verificar RLS está habilitado
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('invitations', 'companies', 'projects');

-- Intentar simular la consulta como anon
SET ROLE anon;
SELECT * FROM invitations WHERE token = 'cf579c4a-f66c-4283-b551-a4ceea5b1ca5' AND status = 'pending';
RESET ROLE;
