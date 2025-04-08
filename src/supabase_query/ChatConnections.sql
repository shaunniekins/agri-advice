create table public."ChatConnections" (
  chat_connection_id uuid null default gen_random_uuid (),
  farmer_id uuid null,
  recipient_technician_id uuid null,
  parent_chat_connection_id uuid null,
  created_at timestamp with time zone not null default now(),
  farmer_deleted boolean not null default false, -- Added
  technician_deleted boolean not null default false, -- Added
  constraint ChatConnections_pkey primary key (chat_connection_id),
  constraint ChatConnections_farmer_id_fkey foreign key (farmer_id) references auth.users (id) on update cascade on delete cascade,
  constraint ChatConnections_recipient_technician_id_fkey foreign key (recipient_technician_id) references auth.users (id) on update cascade on delete cascade,
  constraint ChatConnections_parent_chat_connection_id_fkey foreign key (parent_chat_connection_id) references "ChatConnections" (chat_connection_id) on update cascade on delete cascade
) tablespace pg_default;