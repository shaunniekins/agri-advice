create view
  public.FarmerUserView as
select
  users.id,
  users.email,
  users.raw_user_meta_data ->> 'first_name'::text as first_name,
  users.raw_user_meta_data ->> 'last_name'::text as last_name,
  users.raw_user_meta_data ->> 'middle_name'::text as middle_name,
  users.raw_user_meta_data ->> 'mobile_number'::text as mobile_number,
  users.raw_user_meta_data ->> 'address'::text as address,
  users.raw_user_meta_data ->> 'user_type'::text as user_type,
  users.raw_user_meta_data ->> 'birth_date'::text as birth_date
from
  auth.users;