CREATE TABLE public."UserOnlineStatus" (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_online BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (user_id)
);
-- Create an index for faster queries
CREATE INDEX idx_user_online_status ON public."UserOnlineStatus" (user_id, is_online);