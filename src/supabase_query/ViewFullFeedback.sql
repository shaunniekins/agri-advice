create view "ViewFullFeedback" as
select 
    f.feedback_id,
    f.farmer_id,
    f.technician_id,
    f.feedback_message,
    f.ratings,
    f.created_at,
    u.raw_user_meta_data as farmer_raw_user_meta_data,
    u2.raw_user_meta_data as technician_raw_user_meta_data
from
    "Feedback" f
    left join auth.users u on f.farmer_id = u.id
    left join auth.users u2 on f.technician_id = u2.id;