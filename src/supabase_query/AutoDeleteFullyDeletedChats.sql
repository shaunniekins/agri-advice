-- Function to handle deletion of fully deleted chat connections
CREATE OR REPLACE FUNCTION public.handle_fully_deleted_chats()
RETURNS TRIGGER AS $$
BEGIN
    -- If both farmer and technician have deleted their copies
    IF (NEW.farmer_deleted = true AND NEW.technician_deleted = true) THEN
        -- Check if this is a shared conversation (has parent_chat_connection_id)
        IF NEW.parent_chat_connection_id IS NOT NULL THEN
            -- For shared conversations, delete immediately when both parties mark as deleted
            DELETE FROM public."ChatConnections" 
            WHERE chat_connection_id = NEW.chat_connection_id;
            
            RETURN NULL; -- Row already deleted
        ELSE 
            -- For parent AI conversations, DO NOT delete automatically
            -- Parent chats should only be deleted manually by the farmer
            RETURN NEW;
        END IF;
    END IF;
    
    RETURN NEW; -- Return the updated row
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS auto_delete_fully_deleted_chats ON public."ChatConnections";
CREATE TRIGGER auto_delete_fully_deleted_chats
AFTER UPDATE OF farmer_deleted, technician_deleted ON public."ChatConnections"
FOR EACH ROW
EXECUTE FUNCTION public.handle_fully_deleted_chats();

-- Comment on trigger
COMMENT ON TRIGGER auto_delete_fully_deleted_chats ON public."ChatConnections" 
IS 'Automatically deletes shared chat connections when both farmer and technician have deleted them. Parent chats are not auto-deleted.';
