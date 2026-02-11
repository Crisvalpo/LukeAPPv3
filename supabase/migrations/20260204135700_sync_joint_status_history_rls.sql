-- ========================================
-- ARREGLAR POLÍTICAS RLS DE joint_status_history
-- ========================================
-- Fecha: 2026-02-04
-- Objetivo: Sincronizar las políticas de historial de estados de juntas con Cloud.

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "joint_status_history_access_policy" ON public.joint_status_history;
DROP POLICY IF EXISTS "Staff full access joint_status_history" ON public.joint_status_history;

-- ALL: Acceso completo si el usuario pertenece al proyecto o a la compañía dueña del proyecto
CREATE POLICY "joint_status_history_access_policy" ON public.joint_status_history
FOR ALL
USING (
  -- 1. Acceso directo si está asignado al proyecto
  project_id IN (
    SELECT m.project_id 
    FROM members m
    WHERE m.user_id = auth.uid() AND m.project_id IS NOT NULL
  )
  OR 
  -- 2. Acceso si pertenece a la compañía dueña del proyecto (Founders/Admins/Staff)
  project_id IN (
    SELECT p.id 
    FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

-- Verificación de las políticas creadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'joint_status_history' 
ORDER BY cmd;
