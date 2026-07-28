-- After deploying the Edge Function `send-push`, create a Database Webhook
-- in the Supabase Dashboard:
--
--   Table:    public.notifications
--   Events:   INSERT
--   Endpoint: https://<project-ref>.supabase.co/functions/v1/send-push
--   Method:   POST
--   Headers:
--     Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
--     Content-Type:  application/json
--
-- The function reads the inserted row from the `record` key in the POST body.
--
-- Alternatively, create the webhook via SQL (pg_net must be enabled):

/*
SELECT
  supabase_functions.http_request(
    url  := 'https://<project-ref>.supabase.co/functions/v1/send-push',
    method := 'POST',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body := to_jsonb(NEW),
    timeout_milliseconds := 5000
  )
-- embed this SELECT in a TRIGGER FUNCTION on notifications AFTER INSERT
*/
