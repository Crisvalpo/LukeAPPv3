-- SECURITY FIX: Add search_path to ALL functions at once
-- This fixes all 27 "function_search_path_mutable" warnings
-- 
-- Strategy: Use ALTER FUNCTION to set search_path without rewriting each one
-- Reference: https://www.postgresql.org/docs/current/sql-alterfunction.html

-- Set search_path for all public functions
DO $$
DECLARE
  func RECORD;
BEGIN
  FOR func IN 
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f' -- Only functions, not procedures
      AND p.proname IN (
        'get_user_projects',
        'update_company_roles_updated_at',
        'generate_request_number',
        'validate_invitation_token',
        'isometric_has_details',
        'count_pending_spooling',
        'count_vigente_isometrics',
        'count_obsolete_isometrics',
        'count_eliminado_isometrics',
        'update_inventory_on_receipt',
        'update_request_status',
        'accept_invitation',
        'classify_spool',
        'calculate_data_status',
        'calculate_material_status',
        'is_fabricable',
        'handle_new_user',
        'extract_isometric_from_spool_id',
        'update_spools_mto_timestamp',
        'get_mto_summary',
        'get_spool_mto',
        'sync_spool_from_weld',
        'update_material_catalog_timestamp',
        'update_spools_joints_timestamp',
        'get_joints_summary',
        'update_updated_at_column',
        'get_total_profiles'
      )
  LOOP
    -- Set search_path for this function
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      func.schema_name,
      func.function_name,
      func.args
    );
    
    RAISE NOTICE 'Fixed: %.%(%)', func.schema_name, func.function_name, func.args;
  END LOOP;
END $$;

-- Verification: Show all functions with their search_path
SELECT 
  p.proname as function_name,
  COALESCE(p.proconfig::text, 'NOT SET') as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname IN (
    'get_user_projects', 'update_company_roles_updated_at', 'generate_request_number',
    'validate_invitation_token', 'isometric_has_details', 'count_pending_spooling',
    'count_vigente_isometrics', 'count_obsolete_isometrics', 'count_eliminado_isometrics',
    'update_inventory_on_receipt', 'update_request_status', 'accept_invitation',
    'classify_spool', 'calculate_data_status', 'calculate_material_status',
    'is_fabricable', 'handle_new_user', 'extract_isometric_from_spool_id',
    'update_spools_mto_timestamp', 'get_mto_summary', 'get_spool_mto',
    'sync_spool_from_weld', 'update_material_catalog_timestamp',
    'update_spools_joints_timestamp', 'get_joints_summary', 'update_updated_at_column',
    'get_total_profiles'
  )
ORDER BY function_name;
