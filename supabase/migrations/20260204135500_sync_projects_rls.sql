-- ========================================
-- ARREGLAR POLÍTICAS RLS DE projects
-- ========================================
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de proyectos con Cloud.

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;
DROP POLICY IF EXISTS "Staff full access projects" ON public.projects;

-- SELECT: Super admins, Founders de la empresa, o Personas asignadas al proyecto
CREATE POLICY "projects_select_policy" ON public.projects
FOR SELECT
USING (
  is_super_admin()
  OR (company_id IN (
    SELECT m.company_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  ))
  OR (id IN (
    SELECT m.project_id FROM members m
    WHERE m.user_id = auth.uid() AND m.project_id IS NOT NULL
  ))
);

-- INSERT: Super admins o Founders
CREATE POLICY "projects_insert_policy" ON public.projects
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR (auth.uid() IN (
    SELECT m.user_id FROM members m
    WHERE m.role_id = 'founder'
  ))
);

-- UPDATE: Super admins, Founders, o Admins asignados al proyecto
CREATE POLICY "projects_update_policy" ON public.projects
FOR UPDATE
USING (
  is_super_admin()
  OR (company_id IN (
    SELECT m.company_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  ))
  OR (id IN (
    SELECT m.project_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role_id = 'admin'
  ))
)
WITH CHECK (
  is_super_admin()
  OR (company_id IN (
    SELECT m.company_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  ))
  OR (id IN (
    SELECT m.project_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role_id = 'admin'
  ))
);

-- DELETE: Super admins o Founders
CREATE POLICY "projects_delete_policy" ON public.projects
FOR DELETE
USING (
  is_super_admin()
  OR (company_id IN (
    SELECT m.company_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  ))
);

-- Verificación de las políticas creadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'projects' 
ORDER BY cmd;
