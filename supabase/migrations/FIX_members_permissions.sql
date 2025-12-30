-- Grant explicit permissions to authenticated role
GRANT SELECT ON public.members TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.company_roles TO authenticated;

-- Verificar permisos
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name IN ('members', 'users', 'companies')
  AND grantee = 'authenticated';
