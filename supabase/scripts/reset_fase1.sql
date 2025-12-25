-- ⚠️ SCRIPT DE LIMPIEZA TOTAL - FASE 1 ⚠️
-- Este script elimina TODOS los datos creados durante las pruebas de la Fase 1 (Onboarding).
-- Ejecútalo en el SQL Editor de Supabase para reiniciar el entorno.

BEGIN;

    -- 0. Limpiar Usuarios de Autenticación (Supabase Auth) - ⚠️ BORRA TODOS LOS LOGINS
    -- Esto a menudo dispara triggers que limpian public.users, pero mantenemos los TRUNCATE abajo por seguridad.
    DELETE FROM auth.users;

    -- 1. Limpiar Invitaciones (Pendientes y Aceptadas)
    TRUNCATE TABLE public.invitations CASCADE;
    
    -- 2. Limpiar Proyectos y todo lo que contienen
    TRUNCATE TABLE public.projects CASCADE;

    -- 3. Limpiar Miembros (Relación Usuarios-Empresas)
    TRUNCATE TABLE public.members CASCADE;

    -- 4. Limpiar Empresas (Root de la jerarquía)
    TRUNCATE TABLE public.companies CASCADE;

    -- 5. Limpiar Perfiles de Usuarios (Public Profiles)
    TRUNCATE TABLE public.users CASCADE;

    -- 6. NORMALIZACIÓN DE ROLES (Limpiar basura y estandarizar)
    -- Eliminar roles viejos o duplicados que no se usan en el código actual
    DELETE FROM public.roles 
    WHERE id IN ('COMPANY_OWNER', 'GUEST', 'PROJECT_ADMIN', 'PROJECT_USER', 'SUPER_ADMIN');

    -- Insertar o Actualizar los roles oficiales con descripciones en Español
    INSERT INTO public.roles (id, description, created_at) VALUES
    ('super_admin', 'Staff LukeAPP - Control Total', NOW()),
    ('founder', 'Fundador - Dueño de Empresa y Proyectos', NOW()),
    ('admin', 'Administrador - Gestión de Proyecto', NOW()),
    ('supervisor', 'Supervisor - Gestión Técnica y Terreno', NOW()),
    ('worker', 'Trabajador - Acceso Básico', NOW())
    ON CONFLICT (id) DO UPDATE 
    SET description = EXCLUDED.description;

COMMIT;

-- Verificaciones Finales
SELECT 'Companies' as table_name, count(*) as count FROM public.companies
UNION ALL
SELECT 'Projects', count(*) FROM public.projects
UNION ALL
SELECT 'Invitations', count(*) FROM public.invitations
UNION ALL
SELECT 'Roles', count(*) FROM public.roles
UNION ALL
SELECT 'Auth Users', count(*) FROM auth.users;
