CREATE OR REPLACE VIEW "FarmerUserView" AS
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'first_name' AS first_name,
  raw_user_meta_data->>'last_name' AS last_name,
  raw_user_meta_data->>'middle_name' AS middle_name,
  raw_user_meta_data->>'mobile_number' AS mobile_number,
  raw_user_meta_data->>'address' AS address,
  raw_user_meta_data->>'user_type' AS user_type,
  raw_user_meta_data->>'birth_date' AS birth_date
FROM auth.users;
