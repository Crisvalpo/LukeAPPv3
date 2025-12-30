-- Migration 0048: Restore Dashboard RPC
-- Fixes 404 on Lobby page by restoring 'get_total_profiles'
-- Updated to query 'public.users' instead of non-existent 'public.profiles'

CREATE OR REPLACE FUNCTION public.get_total_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT count(*) FROM public.users);
END;
$$;

-- Grant execution to public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_total_profiles() TO anon, authenticated;

COMMENT ON FUNCTION public.get_total_profiles IS 'Returns the total number of registered users for landing page stats.';
