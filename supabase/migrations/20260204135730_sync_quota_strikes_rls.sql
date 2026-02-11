-- ========================================
-- ARREGLAR POLÍTICAS RLS DE quota_strikes
-- ========================================
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de quota_strikes con Cloud.

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Staff full access quota_strikes" ON public.quota_strikes;
DROP POLICY IF EXISTS "System can insert quota strikes" ON public.quota_strikes;
DROP POLICY IF EXISTS "Authenticated users can select quota strikes" ON public.quota_strikes;

-- 1. ALL: Super admins tienen acceso completo
CREATE POLICY "Staff full access quota_strikes" ON public.quota_strikes
FOR ALL
USING (is_super_admin());

-- 2. INSERT: El sistema puede insertar (ej. via edge functions o triggers)
CREATE POLICY "System can insert quota strikes" ON public.quota_strikes
FOR INSERT
WITH CHECK (true);

-- 3. SELECT: Usuarios autenticados pueden ver strikes de su propia compañía
CREATE POLICY "Authenticated users can select quota strikes" ON public.quota_strikes
FOR SELECT
USING (
  company_id IN (SELECT get_my_company_ids_v2())
);

-- Verificación de las políticas creadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'quota_strikes' 
ORDER BY cmd;
