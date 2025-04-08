-- Add archive columns to ChatConnections table with default values of false
ALTER TABLE "ChatConnections"
ADD COLUMN IF NOT EXISTS farmer_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS technician_archived BOOLEAN DEFAULT FALSE;

-- Comment on the new columns
COMMENT ON COLUMN "ChatConnections".farmer_archived IS 'Whether the chat has been archived by the farmer';
COMMENT ON COLUMN "ChatConnections".technician_archived IS 'Whether the chat has been archived by the technician';
