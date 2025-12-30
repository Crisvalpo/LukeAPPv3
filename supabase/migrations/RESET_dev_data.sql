-- RESET COMPLETO - Solo para DESARROLLO
-- ⚠️ ADVERTENCIA: Esto borra TODOS los datos de engineering

-- 1. Deshabilitar triggers temporalmente
SET session_replication_role = replica;

-- 2. Limpiar tablas en orden de dependencias
TRUNCATE TABLE spools_welds CASCADE;
TRUNCATE TABLE spools_mto CASCADE;
TRUNCATE TABLE spools_joints CASCADE;
TRUNCATE TABLE engineering_revisions CASCADE;
TRUNCATE TABLE isometrics CASCADE;

-- 3. Re-habilitar triggers
SET session_replication_role = DEFAULT;

-- 4. Verificar limpieza
SELECT 
  'spools_welds' as table_name, 
  COUNT(*) as row_count 
FROM spools_welds
UNION ALL
SELECT 'spools_mto', COUNT(*) FROM spools_mto
UNION ALL
SELECT 'spools_joints', COUNT(*) FROM spools_joints
UNION ALL
SELECT 'engineering_revisions', COUNT(*) FROM engineering_revisions
UNION ALL
SELECT 'isometrics', COUNT(*) FROM isometrics;

-- ✅ Todas las tablas deberían mostrar 0 rows
