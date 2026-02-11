-- ============================================================================
-- SINCRONIZACIÓN DE RLS: BLOQUE FINAL (USUARIOS, TALLERES Y NOTIFICACIONES)
-- ============================================================================
-- Tablas: structure_models, system_notifications, users, work_schedules, 
--         workshops, workshop_deliveries.
-- Fecha: 2026-02-04
-- Objetivo: Completar la paridad total de RLS con Cloud.

-- ----------------------------------------------------------------------------
-- 1. Tabla: users (Perfiles de Usuario)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_staff_read_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_staff_read_all" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: workshops (Talleres)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage workshops" ON public.workshops;
DROP POLICY IF EXISTS "Users can view workshops" ON public.workshops;

CREATE POLICY "Users can manage workshops" ON public.workshops
FOR ALL USING (
  project_id IN (
    SELECT project_id FROM members 
    WHERE user_id = auth.uid() AND role_id IN ('admin', 'founder', 'supervisor')
  )
);

CREATE POLICY "Users can view workshops" ON public.workshops
FOR SELECT USING (
  project_id IN (SELECT project_id FROM members WHERE user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- 3. Tabla: workshop_deliveries (Entregas de Taller)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project members can manage workshop_deliveries" ON public.workshop_deliveries;
DROP POLICY IF EXISTS "Users can view workshop_deliveries" ON public.workshop_deliveries;

CREATE POLICY "Project members can manage workshop_deliveries" ON public.workshop_deliveries
FOR ALL USING (
  project_id IN (SELECT project_id FROM members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view workshop_deliveries" ON public.workshop_deliveries
FOR SELECT USING (
  project_id IN (SELECT project_id FROM members WHERE user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- 4. Tabla: work_schedules (Turnos/Horarios)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Manage work_schedules" ON public.work_schedules;
DROP POLICY IF EXISTS "View work_schedules" ON public.work_schedules;

CREATE POLICY "Manage work_schedules" ON public.work_schedules
FOR ALL USING (
  project_id IN (
    SELECT m.project_id FROM members m 
    WHERE m.user_id = auth.uid() AND m.role_id IN ('admin', 'supervisor')
  )
  OR project_id IN (
    SELECT p.id FROM projects p JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid() AND m.role_id = 'founder'
  )
  OR auth.uid() IN (SELECT user_id FROM members WHERE role_id = 'super_admin')
);

CREATE POLICY "View work_schedules" ON public.work_schedules
FOR SELECT USING (project_id IN (SELECT id FROM projects));

-- ----------------------------------------------------------------------------
-- 5. Tabla: system_notifications
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.system_notifications;

CREATE POLICY "System can insert notifications" ON public.system_notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view notifications" ON public.system_notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE user_id = auth.uid() 
      AND company_id = system_notifications.company_id 
      AND role_id IN ('founder', 'super_admin', 'admin')
  )
);

-- ----------------------------------------------------------------------------
-- 6. Tabla: structure_models (Modelos 3D / Estructura)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.structure_models;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.structure_models;

CREATE POLICY "Enable all access for authenticated users" ON public.structure_models
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
