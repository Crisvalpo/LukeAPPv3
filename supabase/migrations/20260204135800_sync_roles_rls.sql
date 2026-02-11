-- ========================================
-- ARREGLAR POLÍTICAS RLS DE roles
-- ========================================
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de roles con Cloud.

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Public read access roles" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.roles;

-- SELECT: Acceso de lectura público (matching Cloud)
-- Nota: Esta tabla contiene roles de sistema (super_admin, founder, admin, member)
-- que deben ser legibles por todos los usuarios autenticados para validaciones.
CREATE POLICY "Public read access roles" ON public.roles
FOR SELECT
USING (true);

-- Verificación de las políticas creadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'roles' 
ORDER BY cmd;
