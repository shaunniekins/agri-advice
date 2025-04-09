-- Add status column to ChatConnections table with default value of 'pending'
ALTER TABLE "ChatConnections"
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Add remarks column to ChatConnections table for storing technician remarks
ALTER TABLE "ChatConnections"
ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT NULL;

-- Comment on the new columns
COMMENT ON COLUMN "ChatConnections".status IS 'Status of the conversation (pending/solved)';
COMMENT ON COLUMN "ChatConnections".remarks IS 'Technician remarks when marking a conversation as solved';
