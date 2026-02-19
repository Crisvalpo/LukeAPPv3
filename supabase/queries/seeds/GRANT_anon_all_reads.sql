-- Otorgar SELECT a 'anon' en TODAS las tablas públicas que puedan necesitarse
-- para mostrar información de invitaciones

GRANT SELECT ON public.invitations TO anon;
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.members TO anon;
GRANT SELECT ON public.company_roles TO anon;

-- Verificar GRANTs
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;
