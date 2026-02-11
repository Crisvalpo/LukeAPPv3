-- ========================================
-- ARREGLAR POLÍTICAS RLS DE invitations
-- ========================================
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de invitaciones con Cloud para permitir 
--           que Founders y Admins gestionen invitaciones.

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "invitations_select_policy" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_policy" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete_policy" ON public.invitations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invitations; -- Nombre común genérico

-- Crear políticas sincronizadas con Cloud

-- SELECT: SuperAdmin, El invitado (por email), Founders de la empresa, o Admins del proyecto
CREATE POLICY "invitations_select_policy" ON public.invitations
FOR SELECT
USING (
  is_super_admin()
  OR (email = (auth.jwt() ->> 'email'::text))
  OR (company_id IN (
    SELECT m.company_id 
    FROM members m 
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  ))
  OR (EXISTS (
    SELECT 1 
    FROM members m 
    WHERE m.user_id = auth.uid() 
      AND m.role_id = 'admin' 
      AND m.company_id = invitations.company_id 
      AND m.project_id = invitations.project_id
  ))
);

-- INSERT: SuperAdmin, Founders de la empresa, o Admins del proyecto
CREATE POLICY "invitations_insert_policy" ON public.invitations
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR (company_id IN (
    SELECT m.company_id 
    FROM members m 
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  ))
  OR (EXISTS (
    SELECT 1 
    FROM members m 
    WHERE m.user_id = auth.uid() 
      AND m.role_id = 'admin' 
      AND m.company_id = invitations.company_id 
      AND m.project_id = invitations.project_id
  ))
);

-- DELETE: SuperAdmin, Founders de la empresa, o Admins del proyecto
CREATE POLICY "invitations_delete_policy" ON public.invitations
FOR DELETE
USING (
  is_super_admin()
  OR (company_id IN (
    SELECT m.company_id 
    FROM members m 
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  ))
  OR (EXISTS (
    SELECT 1 
    FROM members m 
    WHERE m.user_id = auth.uid() 
      AND m.role_id = 'admin' 
      AND m.company_id = invitations.company_id 
      AND m.project_id = invitations.project_id
  ))
);

-- Verificación de las políticas creadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'invitations' 
ORDER BY cmd;
