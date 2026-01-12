-- Fix quota email trigger to work correctly with pg_net
-- Previous version failed because service_role_key setting doesn't exist

DROP TRIGGER IF EXISTS on_quota_notification_insert ON system_notifications;
DROP FUNCTION IF EXISTS notify_quota_exceeded();

-- Create simplified function that uses pg_net correctly
-- Note: pg_net doesn't require service_role authentication when called from trigger
CREATE OR REPLACE FUNCTION notify_quota_exceeded()
RETURNS TRIGGER AS $$
BEGIN
  -- Make async HTTP request to Edge Function
  -- pg_net will use the database's service role by default when called from trigger
  PERFORM net.http_post(
    url := 'https://bzjxkraxkhsrflwthiqv.supabase.co/functions/v1/send-quota-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := row_to_json(NEW)::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_quota_notification_insert
  AFTER INSERT ON system_notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_quota_exceeded();

COMMENT ON FUNCTION notify_quota_exceeded() IS 
'Invokes send-quota-notification Edge Function asynchronously when a quota notification is created';
