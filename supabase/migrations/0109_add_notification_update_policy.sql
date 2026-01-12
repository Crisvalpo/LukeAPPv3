-- Add UPDATE policy to system_notifications for service role
-- The Edge Function needs to mark notifications as sent after sending emails

-- Add policy to allow UPDATE from service role (used by Edge Functions)
CREATE POLICY "Service role can update notifications"
ON system_notifications
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Also grant UPDATE to authenticated (for Edge Function with service_role)
GRANT UPDATE ON system_notifications TO authenticated;

COMMENT ON POLICY "Service role can update notifications" ON system_notifications IS
'Allows Edge Functions running with service_role to mark notifications as sent';
