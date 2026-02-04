-- FIX FUNCTION SECURITY (Definitive Sync with Cloud)
-- Ensures is_super_admin() has SECURITY DEFINER to avoid infinite recursion.

BEGIN;

-- 1. Explicitly drop to ensure clean recreation
DROP FUNCTION IF EXISTS public.is_super_admin();

-- 2. Re-create with robust security settings
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- CRITICAL: Bypasses RLS by running as creator (postgres)
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members 
    WHERE user_id = (select auth.uid()) 
    AND role_id = 'super_admin'
  );
$$;

-- 3. Grant access
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;

RAISE NOTICE '✅ is_super_admin() hardened with SECURITY DEFINER';

COMMIT;
