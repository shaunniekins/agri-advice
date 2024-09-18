create view "ViewChatMessagesWithFullData" as
select
    cm.chat_message_id,
    cm.chat_connection_id,
    cm.created_at as message_created_at,
    cm.message,
    cm.last_accessed_at,
    farmer_user.id as farmer_id,
    (farmer_user.raw_user_meta_data->>'first_name') as farmer_first_name,
    (farmer_user.raw_user_meta_data->>'last_name') as farmer_last_name,
    technician_user.id as technician_id,
    (technician_user.raw_user_meta_data->>'first_name') as technician_first_name,
    (technician_user.raw_user_meta_data->>'last_name') as technician_last_name,
    sender_user.id as sender_id,
    (sender_user.raw_user_meta_data->>'first_name') as sender_first_name,
    (sender_user.raw_user_meta_data->>'last_name') as sender_last_name
from
    public."ChatMessages" cm
join
    public."ChatConnections" cc
    on cm.chat_connection_id = cc.chat_connection_id
join
    auth.users as farmer_user
    on cc.farmer_id = farmer_user.id
join
    auth.users as technician_user
    on cc.technician_id = technician_user.id
join
    auth.users as sender_user
    on cm.sender_id = sender_user.id;
