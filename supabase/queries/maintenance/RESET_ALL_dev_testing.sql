-- COMPLETE RESET for E2E Testing
-- ⚠️⚠️⚠️ WARNING: This will DELETE ALL DATA including AUTH USERS ⚠️⚠️⚠️
-- Only use in development environment
-- This is a NUCLEAR RESET - You will need to re-signup

-- Disable triggers temporarily
SET session_replication_role = replica;

-- 1. DELETE AUTH USERS FIRST (cascades to all auth tables)
DELETE FROM auth.users;

-- 2. Application tables (public schema)
TRUNCATE TABLE public.material_receipt_items CASCADE;
TRUNCATE TABLE public.material_receipts CASCADE;
TRUNCATE TABLE public.material_request_items CASCADE;
TRUNCATE TABLE public.material_requests CASCADE;
TRUNCATE TABLE public.material_instances CASCADE;
TRUNCATE TABLE public.material_inventory CASCADE;
TRUNCATE TABLE public.material_catalog CASCADE;

TRUNCATE TABLE public.spools_joints CASCADE;
TRUNCATE TABLE public.spools_mto CASCADE;
TRUNCATE TABLE public.spools_welds CASCADE;
TRUNCATE TABLE public.spools CASCADE;

TRUNCATE TABLE public.engineering_revisions CASCADE;
TRUNCATE TABLE public.isometrics CASCADE;

TRUNCATE TABLE public.invitations CASCADE;
TRUNCATE TABLE public.members CASCADE;
TRUNCATE TABLE public.company_roles CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.companies CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verification: Show row counts
SELECT 
  'users' as table_name, COUNT(*) as rows FROM public.users
UNION ALL
SELECT 'companies', COUNT(*) FROM public.companies
UNION ALL
SELECT 'members', COUNT(*) FROM public.members
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'isometrics', COUNT(*) FROM public.isometrics
UNION ALL
SELECT 'engineering_revisions', COUNT(*) FROM public.engineering_revisions
UNION ALL
SELECT 'spools_welds', COUNT(*) FROM public.spools_welds;

-- Show what's left in auth
SELECT 
  'auth.users' as table_name, 
  COUNT(*) as rows 
FROM auth.users;
