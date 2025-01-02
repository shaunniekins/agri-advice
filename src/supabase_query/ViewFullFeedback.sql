CREATE OR REPLACE VIEW public."ViewFullFeedback" AS
SELECT f.feedback_id,
    f.chat_connection_id,
    f.feedback_message,
    f.ratings,
    f.created_at AS feedback_created_at,
    cc.farmer_id,
    cc.recipient_technician_id,
    cc.parent_chat_connection_id,
    f_user.raw_user_meta_data->>'first_name' as farmer_first_name,
    f_user.raw_user_meta_data->>'last_name' as farmer_last_name,
    t_user.raw_user_meta_data->>'first_name' as technician_first_name,
    t_user.raw_user_meta_data->>'last_name' as technician_last_name,
    (
        SELECT message
        FROM public."ChatMessages" cm
        WHERE cm.chat_connection_id = cc.chat_connection_id
        ORDER BY cm.created_at ASC
        LIMIT 1
    ) as initial_message
FROM public."Feedback" f
    JOIN public."ChatConnections" cc ON f.chat_connection_id = cc.chat_connection_id
    LEFT JOIN auth.users f_user ON cc.farmer_id = f_user.id
    LEFT JOIN auth.users t_user ON cc.recipient_technician_id = t_user.id;