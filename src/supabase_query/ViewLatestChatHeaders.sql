create or replace view "ViewLatestChatHeaders" as with ranked_messages as (
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
    cc.farmer_deleted,
    cc.technician_deleted,
    cc.farmer_archived,
    cc.technician_archived,
    cc.status,
    cc.remarks,
    cm.created_at,
    -- Keep sender/receiver of the specific message if needed
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
    left join auth.users sender_user on cm.sender_id = sender_user.id
    left join auth.users receiver_user on cm.receiver_id = receiver_user.id
),
unread_counts as (
  -- Only count messages where a user is the RECEIVER and hasn't read them yet
  select 
    chat_connection_id,
    receiver_id as user_id,
    count(*) as unread_count
  from "ChatMessages"
  where is_receiver_read = false and receiver_id is not null
  group by chat_connection_id, receiver_id
)
select 
  first_msg.chat_connection_id,
  first_msg.farmer_id,
  first_msg.parent_chat_connection_id,
  first_msg.recipient_technician_id,
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
  -- Deletion flags
  first_msg.farmer_deleted,
  first_msg.technician_deleted,
  -- Archive flags
  first_msg.farmer_archived,
  first_msg.technician_archived,
  -- Status and remarks
  first_msg.status,
  first_msg.remarks,
  -- Farmer Name (based on farmer_id) - For Remarks/Solved View
  farmer_user.raw_user_meta_data->>'first_name' as farmer_first_name,
  farmer_user.raw_user_meta_data->>'last_name' as farmer_last_name,
  -- Technician Name (based on recipient_technician_id) - For Remarks/Solved View
  technician_user.raw_user_meta_data->>'first_name' as technician_first_name,
  technician_user.raw_user_meta_data->>'last_name' as technician_last_name,
  -- Partner Name (for Sidebar Display) - Show Technician name if tech exists, otherwise null (AI chat)
  technician_user.raw_user_meta_data->>'first_name' as display_technician_first_name,
  technician_user.raw_user_meta_data->>'last_name' as display_technician_last_name,
  -- Also provide farmer name specifically for sidebar display when technician is logged in
  farmer_user.raw_user_meta_data->>'first_name' as display_farmer_first_name,
  farmer_user.raw_user_meta_data->>'last_name' as display_farmer_last_name,
  -- Keep original sender/receiver metadata if needed elsewhere
  first_msg.sender_meta_data,
  first_msg.receiver_meta_data,
  -- Simplified unread message count
  COALESCE(unread.unread_count, 0) as unread_count
from ranked_messages first_msg
  join ranked_messages latest_msg on first_msg.chat_connection_id = latest_msg.chat_connection_id
  -- Join auth.users for farmer name
  left join auth.users farmer_user on first_msg.farmer_id = farmer_user.id
  -- Join auth.users for technician name
  left join auth.users technician_user on first_msg.recipient_technician_id = technician_user.id
  -- Join for unread counts
  left join unread_counts unread on 
    first_msg.chat_connection_id = unread.chat_connection_id
where first_msg.first_message_rank = 1
  and latest_msg.latest_message_rank = 1;