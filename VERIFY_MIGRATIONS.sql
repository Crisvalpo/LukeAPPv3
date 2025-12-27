-- Script de Verificación Segura
-- Ejecuta esto en Supabase SQL Editor para ver el estado

-- 1. Verificar Tabla company_roles
SELECT 'Tabla company_roles existe' as check_name, 
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_roles'
) as exists;

-- 2. Verificar columnas en members
SELECT 'Columna functional_role_id en members' as check_name, 
EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'members' 
    AND column_name = 'functional_role_id'
) as exists;

-- 3. Verificar Función de Clonado
SELECT 'Función clone_standard_piping_roles existe' as check_name, 
EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'clone_standard_piping_roles'
) as exists;

-- 4. Contar roles existentes (debería ser 0 o 14 si ya corrió)
SELECT 'Roles existentes' as check_name, 
(SELECT count(*) FROM company_roles) as count;
