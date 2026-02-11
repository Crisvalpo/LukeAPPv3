-- ========================================
-- ARREGLAR POLÍTICAS RLS DE CAPA DE SPOOLS
-- ========================================
-- Tablas: spools, spools_joints, spools_mto
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de la capa de spools con Cloud.

-- ----------------------------------------------------------------------------
-- 1. Tabla: spools
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "spools_access_policy" ON public.spools;
DROP POLICY IF EXISTS "Staff full access spools" ON public.spools;

CREATE POLICY "spools_access_policy" ON public.spools
FOR ALL
USING (
  -- Acceso directo si eres miembro del proyecto
  project_id IN (
    SELECT m.project_id FROM members m
    WHERE m.user_id = auth.uid() AND m.project_id IS NOT NULL
  )
  OR 
  -- Acceso si perteneces a la compañía dueña del proyecto
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: spools_joints
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage spools_joints" ON public.spools_joints;
DROP POLICY IF EXISTS "Users can view spools_joints" ON public.spools_joints;
DROP POLICY IF EXISTS "Staff full access spools_joints" ON public.spools_joints;

CREATE POLICY "Users can manage spools_joints" ON public.spools_joints
FOR ALL
USING (
  company_id IN (
    SELECT m.company_id FROM members m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view spools_joints" ON public.spools_joints
FOR SELECT
USING (
  company_id IN (
    SELECT m.company_id FROM members m 
    WHERE m.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- 3. Tabla: spools_mto
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage spools_mto" ON public.spools_mto;
DROP POLICY IF EXISTS "Users can view spools_mto" ON public.spools_mto;
DROP POLICY IF EXISTS "Staff full access spools_mto" ON public.spools_mto;

CREATE POLICY "Users can manage spools_mto" ON public.spools_mto
FOR ALL
USING (
  company_id IN (
    SELECT m.company_id FROM members m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view spools_mto" ON public.spools_mto
FOR SELECT
USING (
  company_id IN (
    SELECT m.company_id FROM members m 
    WHERE m.user_id = auth.uid()
  )
);

-- Verificación de las políticas creadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('spools', 'spools_joints', 'spools_mto') 
ORDER BY tablename, cmd;
