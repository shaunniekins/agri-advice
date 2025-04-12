-- Create a scheduled function that runs periodically to clean up stale statuses
CREATE OR REPLACE FUNCTION scheduled_cleanup_stale_statuses()
RETURNS void AS $$
DECLARE
  stale_threshold TIMESTAMP;
BEGIN
  stale_threshold := NOW() - INTERVAL '30 seconds';

  UPDATE public."UserOnlineStatus"
  SET is_online = false
  WHERE last_seen < stale_threshold AND is_online = true;
END;
$$ LANGUAGE plpgsql;

-- Reminder: If using this scheduled function, set it up via pg_cron or similar:
-- Example: SELECT cron.schedule('*/1 * * * *', 'SELECT scheduled_cleanup_stale_statuses()'); -- Runs every minute
