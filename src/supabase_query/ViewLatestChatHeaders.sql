create view "ViewLatestChatHeaders" as
select distinct on (cc.chat_connection_id) cc.chat_connection_id,
  cm.chat_message_id,
  cm.message,
  cm.is_read,
  cm.sender_id,
  cm.receiver_id,
  -- receiver_id and farmer_id are basically the same
  cc.farmer_id,
  cc.recipient_technician_id,
  cc.parent_chat_connection_id,
  cm.created_at,
  sender_user.raw_user_meta_data->>'first_name' as sender_first_name,
  sender_user.raw_user_meta_data->>'last_name' as sender_last_name,
  COALESCE(
    receiver_user.raw_user_meta_data->>'first_name',
    'AI Assistant'
  ) as receiver_first_name,
  COALESCE(
    receiver_user.raw_user_meta_data->>'last_name',
    ''
  ) as receiver_last_name,
  sender_user.raw_user_meta_data as sender_meta_data,
  COALESCE(receiver_user.raw_user_meta_data, '{}'::jsonb) as receiver_meta_data
from "ChatConnections" cc
  left join "ChatMessages" cm on cc.chat_connection_id = cm.chat_connection_id
  join auth.users sender_user on cm.sender_id = sender_user.id
  left join auth.users receiver_user on cm.receiver_id = receiver_user.id
order by cc.chat_connection_id,
  cm.created_at asc nulls last;