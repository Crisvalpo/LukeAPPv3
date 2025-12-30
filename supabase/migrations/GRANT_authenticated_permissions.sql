-- Otorgar permisos completos a authenticated para operaciones CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT ON public.company_roles TO authenticated;

-- Verificar permisos otorgados
SELECT 
    grantee,
    table_name,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND grantee = 'authenticated'
  AND table_name IN ('companies', 'projects', 'members', 'users', 'invitations', 'company_roles')
GROUP BY grantee, table_name
ORDER BY table_name;
