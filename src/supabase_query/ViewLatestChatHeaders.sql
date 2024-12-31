create view "ViewLatestChatHeaders" as with ranked_messages as (
  select cc.chat_connection_id,
    cm.chat_message_id,
    cm.message,
    cm.is_sender_read,
    cm.is_receiver_read,
    cm.sender_id,
    cm.receiver_id,
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
    COALESCE(receiver_user.raw_user_meta_data, '{}'::jsonb) as receiver_meta_data,
    row_number() over (
      partition by cc.chat_connection_id
      order by cm.created_at asc nulls last
    ) as first_message_rank,
    row_number() over (
      partition by cc.chat_connection_id
      order by cm.created_at desc nulls first
    ) as latest_message_rank
  from "ChatConnections" cc
    left join "ChatMessages" cm on cc.chat_connection_id = cm.chat_connection_id
    join auth.users sender_user on cm.sender_id = sender_user.id
    left join auth.users receiver_user on cm.receiver_id = receiver_user.id
)
select first_msg.chat_connection_id,
  first_msg.parent_chat_connection_id as parent_chat_connection_id,
  -- recipient_technician_id
  first_msg.recipient_technician_id as recipient_technician_id,
  -- First message details
  first_msg.chat_message_id as first_chat_message_id,
  first_msg.message as first_message,
  first_msg.created_at as first_created_at,
  first_msg.sender_id as first_sender_id,
  first_msg.receiver_id as first_receiver_id,
  -- Latest message details
  latest_msg.chat_message_id as latest_chat_message_id,
  latest_msg.message as latest_message,
  latest_msg.created_at as latest_created_at,
  latest_msg.is_sender_read,
  latest_msg.is_receiver_read,
  latest_msg.sender_id as latest_sender_id,
  latest_msg.receiver_id as latest_receiver_id,
  -- Common details
  first_msg.sender_first_name,
  first_msg.sender_last_name,
  first_msg.receiver_first_name,
  first_msg.receiver_last_name,
  first_msg.sender_meta_data,
  first_msg.receiver_meta_data
from ranked_messages first_msg
  join ranked_messages latest_msg on first_msg.chat_connection_id = latest_msg.chat_connection_id
where first_msg.first_message_rank = 1
  and latest_msg.latest_message_rank = 1;