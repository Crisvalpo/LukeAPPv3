-- CRITICAL: Ensure base permissions for 'authenticated' role
-- RLS policies are useless if the user cannot SELECT from the table at all.

-- 1. Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant SELECT, INSERT, UPDATE, DELETE on tables used in Middleware & App
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT ON public.roles TO authenticated;

-- 3. Grant SELECT on invitations to anon (for accepting invites)
GRANT SELECT ON public.invitations TO anon;

-- Extra: Ensure sequences have permissions too (for inserts)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
