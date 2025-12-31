-- 🚨 EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE 🚨

-- 1. Asegurar permisos básicos (GRANT)
GRANT ALL ON TABLE project_locations TO authenticated;
GRANT ALL ON TABLE project_locations TO service_role;
GRANT ALL ON TABLE spool_tags_registry TO authenticated;
GRANT ALL ON TABLE spool_tags_registry TO service_role;

-- 2. Limpiar políticas antiguas (Project Locations)
ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_locations_company_access" ON project_locations;
DROP POLICY IF EXISTS "Enable access for users in the same company" ON project_locations;
DROP POLICY IF EXISTS "Enable read access for all users" ON project_locations;
DROP POLICY IF EXISTS "policy_project_locations_isolation" ON project_locations;

-- 3. Crear política ROBUSTA y SIMPLE (Project Locations)
-- Permitir todo si el usuario pertenece a la misma compañía que la ubicación
CREATE POLICY "policy_project_locations_isolation"
ON project_locations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM members 
        WHERE members.user_id = auth.uid() 
        AND members.company_id = project_locations.company_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members 
        WHERE members.user_id = auth.uid() 
        AND members.company_id = project_locations.company_id
    )
);

-- 4. Limpiar políticas antiguas (Spool Tags)
ALTER TABLE spool_tags_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spool_tags_registry_company_access" ON spool_tags_registry;
DROP POLICY IF EXISTS "policy_spool_tags_registry_isolation" ON spool_tags_registry;

-- 5. Crear política ROBUSTA y SIMPLE (Spool Tags)
CREATE POLICY "policy_spool_tags_registry_isolation"
ON spool_tags_registry
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM members 
        WHERE members.user_id = auth.uid() 
        AND members.company_id = spool_tags_registry.company_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members 
        WHERE members.user_id = auth.uid() 
        AND members.company_id = spool_tags_registry.company_id
    )
);

-- 6. Verificación (Opcional)
SELECT 'Políticas aplicadas correctamente' as result;
