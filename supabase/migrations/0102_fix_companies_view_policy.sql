-- Ensure robust RLS for companies table so Admins/Workers can see company name

-- Helper function to get my company IDs (already created in 0101 but defining safe version here if needed or reusing)
-- We will use the v2 one created in previous step: public.get_my_company_ids_v2()

-- Drop potentially restrictive policies
DROP POLICY IF EXISTS "Members can view their company" ON public.companies;
DROP POLICY IF EXISTS "Founders can select their company" ON public.companies;

-- Create unified policy for ALL members to view their company
CREATE POLICY "Members can select their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
    id IN (SELECT public.get_my_company_ids_v2())
);
