CREATE VIEW public."ViewFullFeedback" AS
SELECT
    f.feedback_id,
    f.chat_message_id,
    f.feedback_message,
    f.ratings,
    f.created_at AS feedback_created_at,
    cm.sender_id,
    cm.receiver_id,
    cm.message AS chat_message,
    cm.is_ai,
    cm.last_accessed_at,
    cm.created_at AS chat_message_created_at,
    sender.raw_user_meta_data AS farmer_raw_user_meta_data,
    receiver.raw_user_meta_data AS technician_raw_user_meta_data
FROM
    public."Feedback" f
JOIN
    public."ChatMessages" cm ON f.chat_message_id = cm.chat_message_id
JOIN
    auth.users sender ON cm.sender_id = sender.id
JOIN
    auth.users receiver ON cm.receiver_id = receiver.id;
