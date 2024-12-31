create view "ViewFullChatMessages" as
select cm.chat_message_id,
  cm.chat_connection_id,
  cm.message,
  cm.is_sender_read,
  cm.is_receiver_read,
  cm.created_at,
  cm.sender_id,
  cm.receiver_id,
  cc.recipient_technician_id,
  coalesce(
    sender_user.raw_user_meta_data->>'profile_picture'::text,
    null
  ) as sender_profile_picture,
  coalesce(
    sender_user.raw_user_meta_data->>'first_name'::text,
    'Unknown'
  ) as sender_first_name,
  coalesce(
    sender_user.raw_user_meta_data->>'last_name'::text,
    'Unknown'
  ) as sender_last_name,
  coalesce(
    sender_user.raw_user_meta_data->>'email'::text,
    'Unknown'
  ) as sender_email,
  coalesce(
    receiver_user.raw_user_meta_data->>'first_name'::text,
    'AI Assistant'
  ) as receiver_first_name,
  coalesce(
    receiver_user.raw_user_meta_data->>'last_name'::text,
    ''
  ) as receiver_last_name,
  coalesce(
    receiver_user.raw_user_meta_data->>'email'::text,
    'ai@assistant.com'
  ) as receiver_email,
  coalesce(
    sender_user.raw_user_meta_data->>'user_type'::text,
    'Unknown'
  ) as sender_user_type,
  coalesce(
    receiver_user.raw_user_meta_data->>'user_type'::text,
    'ai'
  ) as receiver_user_type,
  case
    when cm.receiver_id is null then true
    else false
  end as is_ai
from "ChatMessages" cm
  left join "ChatConnections" cc on cm.chat_connection_id = cc.chat_connection_id
  left join auth.users sender_user on cm.sender_id = sender_user.id
  left join auth.users receiver_user on cm.receiver_id = receiver_user.id;