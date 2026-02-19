-- Migration: Fix RLS permissions for weld_status_history
-- Issue: Users getting "permission denied for table weld_status_history"

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.weld_status_history TO authenticated;

-- Also grant INSERT for when they create history records
GRANT INSERT ON public.weld_status_history TO authenticated;

SELECT 'weld_status_history permissions fixed' as status;
