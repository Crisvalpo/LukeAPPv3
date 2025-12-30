-- Otorgar permisos SELECT a 'anon' para validar invitaciones sin login
GRANT SELECT ON public.invitations TO anon;

-- Verificar permisos
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'invitations'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
