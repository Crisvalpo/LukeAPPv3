-- ========================================
-- ARREGLAR POLÍTICAS RLS DE company_roles
-- ========================================
-- Fecha: 2026-02-04
-- Problema: La función clone_standard_piping_roles falla por políticas RLS desincronizadas

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "company_roles_select_policy" ON public.company_roles;
DROP POLICY IF EXISTS "company_roles_insert_policy" ON public.company_roles;
DROP POLICY IF EXISTS "company_roles_update_policy" ON public.company_roles;
DROP POLICY IF EXISTS "company_roles_delete_policy" ON public.company_roles;
DROP POLICY IF EXISTS "Staff full access company_roles" ON public.company_roles;

-- Crear políticas sincronizadas con Cloud

-- SELECT: Super admin o miembros de la compañía
CREATE POLICY "company_roles_select_policy" ON public.company_roles
FOR SELECT
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Super admin o founders de la compañía
CREATE POLICY "company_roles_insert_policy" ON public.company_roles
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND role_id = 'founder'
  )
);

-- UPDATE: Super admin o founders de la compañía
CREATE POLICY "company_roles_update_policy" ON public.company_roles
FOR UPDATE
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND role_id = 'founder'
  )
);

-- DELETE: Super admin o founders de la compañía
CREATE POLICY "company_roles_delete_policy" ON public.company_roles
FOR DELETE
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND role_id = 'founder'
  )
);

-- Verificación
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'company_roles' 
ORDER BY cmd;
