-- Grant SELECT access to service_role for email notifications
-- Edge Functions need to read company names and member emails

-- Allow service_role to SELECT from companies
CREATE POLICY "Service role can read companies"
ON companies
FOR SELECT
TO service_role
USING (true);

-- Allow service_role to SELECT from members
CREATE POLICY "Service role can read members"
ON members
FOR SELECT
TO service_role
USING (true);

COMMENT ON POLICY "Service role can read companies" ON companies IS
'Allows Edge Functions to fetch company names for email notifications';

COMMENT ON POLICY "Service role can read members" ON members IS
'Allows Edge Functions to fetch member emails for email notifications';
