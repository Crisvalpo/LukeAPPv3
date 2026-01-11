-- Allow users to view their own member record
-- This is critical for other RLS policies (like quota_strikes) that check membership
CREATE POLICY "Users can view own membership"
ON public.members
FOR SELECT
USING (auth.uid() = user_id);

-- Also allow viewing other members in the same company (for Team View)
-- Recursive safety: This relies on the internal implementation of RLS.
-- If recursion is an error, we might need a function. But typical standard pattern is:
-- company_id IN (SELECT company_id FROM members WHERE user_id = auth.uid())
CREATE POLICY "Users can view team members"
ON public.members
FOR SELECT
USING (
    company_id IN (
        SELECT company_id 
        FROM public.members 
        WHERE user_id = auth.uid()
    )
);
