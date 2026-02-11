-- ============================================================================
-- SINCRONIZACIÓN DE RLS: CONFIGURACIÓN DE PROYECTO Y PERSONAL
-- ============================================================================
-- Tablas: project_locations, project_personnel, project_weld_type_config.
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de configuración y personal con Cloud.

-- ----------------------------------------------------------------------------
-- 1. Tabla: project_locations
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "policy_project_locations_isolation" ON public.project_locations;
CREATE POLICY "policy_project_locations_isolation" ON public.project_locations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM members WHERE user_id = auth.uid() AND company_id = project_locations.company_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM members WHERE user_id = auth.uid() AND company_id = project_locations.company_id
  )
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: project_personnel
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Manage personnel" ON public.project_personnel;
DROP POLICY IF EXISTS "View personnel" ON public.project_personnel;

-- Manage: SuperAdmin, Founders de la compañía, o Admins/Supervisores del proyecto
CREATE POLICY "Manage personnel" ON public.project_personnel
FOR ALL USING (
  -- 1. Admins/Supervisores asignados al proyecto
  project_id IN (
    SELECT m.project_id FROM members m 
    WHERE m.user_id = auth.uid() AND m.role_id IN ('admin', 'supervisor')
  )
  OR 
  -- 2. Founders de la compañía dueña del proyecto
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  )
  OR 
  -- 3. Super Admins
  auth.uid() IN (SELECT user_id FROM members WHERE role_id = 'super_admin')
);

-- View: Permitir ver a cualquier usuario logueado (Matching Cloud logic)
CREATE POLICY "View personnel" ON public.project_personnel
FOR SELECT USING (project_id IN (SELECT id FROM projects));

-- ----------------------------------------------------------------------------
-- 3. Tabla: project_weld_type_config
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins and founders can manage weld types" ON public.project_weld_type_config;
DROP POLICY IF EXISTS "Users can view weld types for their company projects" ON public.project_weld_type_config;

-- Manage: Admins o Founders de la compañía
CREATE POLICY "Admins and founders can manage weld types" ON public.project_weld_type_config
FOR ALL USING (
  company_id IN (
    SELECT m.company_id FROM members m
    LEFT JOIN company_roles cr ON m.functional_role_id = cr.id
    WHERE m.user_id = auth.uid() 
      AND (m.role_id IN ('founder', 'admin') OR cr.base_role IN ('admin', 'founder'))
  )
);

-- View: Usuarios de la compañía
CREATE POLICY "Users can view weld types for their company projects" ON public.project_weld_type_config
FOR SELECT USING (
  company_id IN (SELECT m.company_id FROM members m WHERE m.user_id = auth.uid())
);
