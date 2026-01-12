-- Create database trigger to invoke Edge Function when quota notification is inserted

-- First, ensure pg_net extension is enabled for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to invoke Edge Function
CREATE OR REPLACE FUNCTION notify_quota_exceeded()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_net to make async HTTP request to Edge Function
  -- This won't block the INSERT operation
  PERFORM net.http_post(
    url := 'https://bzjxkraxkhsrflwthiqv.supabase.co/functions/v1/send-quota-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := row_to_json(NEW)::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on system_notifications
DROP TRIGGER IF EXISTS on_quota_notification_insert ON system_notifications;

CREATE TRIGGER on_quota_notification_insert
  AFTER INSERT ON system_notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_quota_exceeded();

COMMENT ON FUNCTION notify_quota_exceeded() IS 
'Invokes send-quota-notification Edge Function asynchronously when a quota notification is created';

COMMENT ON TRIGGER on_quota_notification_insert ON system_notifications IS
'Triggers email sending when quota limits are exceeded';
