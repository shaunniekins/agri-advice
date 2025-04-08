-- Create a function to automatically clean up stale online statuses
CREATE OR REPLACE FUNCTION cleanup_stale_online_statuses() RETURNS trigger AS $$
DECLARE
  stale_threshold TIMESTAMP;
BEGIN
  -- Set threshold time (reduced to 30 seconds ago for more aggressive cleanup)
  stale_threshold := NOW() - INTERVAL '30 seconds';
  
  -- Set is_online to false for any records where last_seen is older than the threshold
  UPDATE public."UserOnlineStatus" 
  SET is_online = false
  WHERE last_seen < stale_threshold AND is_online = true;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs this function periodically
CREATE OR REPLACE FUNCTION create_online_status_cleanup_trigger() RETURNS void AS $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS online_status_cleanup_trigger ON public."UserOnlineStatus";
  
  -- Create new trigger that runs after any insert or update
  CREATE TRIGGER online_status_cleanup_trigger
  AFTER INSERT OR UPDATE ON public."UserOnlineStatus"
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_stale_online_statuses();
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the trigger
SELECT create_online_status_cleanup_trigger();

-- Create a scheduled function that runs every 15 seconds to clean up stale statuses
-- This ensures cleanup happens even if there are no inserts/updates
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

-- Note: You'll need to set up pgcron extension and run:
-- SELECT cron.schedule('*/15 * * * * *', 'SELECT scheduled_cleanup_stale_statuses()');
-- Or implement this through your server-side scheduled tasks
