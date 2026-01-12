-- Ensure RLS is enabled
ALTER TABLE public.quota_strikes ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users (Crucial step often missed)
GRANT SELECT, INSERT ON public.quota_strikes TO authenticated;

-- Re-create the helper function just in case
CREATE OR REPLACE FUNCTION public.get_my_company_ids_v2()
RETURNS TABLE (company_id uuid) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT m.company_id
    FROM public.members m
    WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE;

-- Drop verify policies
DROP POLICY IF EXISTS "Users can view their own company strikes" ON public.quota_strikes;
DROP POLICY IF EXISTS "System can insert strikes" ON public.quota_strikes;
DROP POLICY IF EXISTS "Authenticated users can select quota strikes" ON public.quota_strikes;

-- Create robust select policy
CREATE POLICY "Authenticated users can select quota strikes"
ON public.quota_strikes
FOR SELECT
TO authenticated
USING (
    company_id IN (SELECT public.get_my_company_ids_v2())
);

-- Insert policy (usually system triggered, but if trigger relies on user context)
-- Since most strikes are via trigger, this might not be needed by user, but let's allow it if the user causes it directly?
-- Actually, stick to SELECT for now as that's the error.
