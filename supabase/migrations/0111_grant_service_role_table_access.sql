-- Grant direct table access to service_role (bypasses RLS)
-- Edge Functions need to read these tables

-- Drop the policies that don't work
DROP POLICY IF EXISTS "Service role can read companies" ON companies;
DROP POLICY IF EXISTS "Service role can read members" ON members;
DROP POLICY IF EXISTS "Service role can update notifications" ON system_notifications;

-- Grant direct SELECT access (bypasses RLS completely)
GRANT SELECT ON companies TO service_role;
GRANT SELECT ON members TO service_role;
GRANT SELECT ON users TO service_role;
GRANT SELECT, UPDATE ON system_notifications TO service_role;

COMMENT ON TABLE companies IS 'service_role has SELECT to fetch company names for emails';
COMMENT ON TABLE members IS 'service_role has SELECT to fetch member emails for notifications';
COMMENT ON TABLE users IS 'service_role has SELECT to fetch user emails';
