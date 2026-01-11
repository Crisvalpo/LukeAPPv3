-- Helper function to avoid recursive RLS loops
-- Returns the list of company IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS TABLE (company_id uuid) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT m.company_id
    FROM public.members m
    WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE;

-- Drop problematic policy that might be failing recursion or permissions
DROP POLICY IF EXISTS "Users can view their own company strikes" ON public.quota_strikes;

-- Create new robust policy
CREATE POLICY "Users can view their own company strikes"
ON public.quota_strikes
FOR SELECT
USING (
    company_id IN (SELECT public.get_my_company_ids())
);
