-- Verificar y desactivar RLS en members si está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'members';

-- Desactivar RLS en members
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- Verificar que funcionó
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'members';
