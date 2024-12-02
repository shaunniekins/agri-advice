CREATE VIEW public."ViewUsers" AS
SELECT
  users.id,
  users.email,
  users.raw_user_meta_data ->> 'first_name' AS first_name,
  users.raw_user_meta_data ->> 'last_name' AS last_name,
  users.raw_user_meta_data ->> 'middle_name' AS middle_name,
  users.raw_user_meta_data ->> 'password' AS password,
  users.raw_user_meta_data ->> 'mobile_number' AS mobile_number,
  users.raw_user_meta_data ->> 'address' AS address,
  users.raw_user_meta_data ->> 'complete_address' AS complete_address,
  users.raw_user_meta_data ->> 'user_type' AS user_type,
  users.raw_user_meta_data ->> 'birth_date' AS birth_date,
  users.raw_user_meta_data ->> 'account_status' AS account_status,
  users.raw_user_meta_data ->> 'profile_picture' AS profile_picture,
  
  -- Conditional fields based on user_type
  CASE
    WHEN users.raw_user_meta_data ->> 'user_type' = 'technician' THEN users.raw_user_meta_data ->> 'license_number'
    ELSE NULL
  END AS license_number,
  
  CASE
    WHEN users.raw_user_meta_data ->> 'user_type' = 'technician' THEN users.raw_user_meta_data ->> 'specialization'
    ELSE NULL
  END AS specialization,

  CASE
    WHEN users.raw_user_meta_data ->> 'user_type' = 'technician' THEN users.raw_user_meta_data ->> 'experiences'
    ELSE NULL
  END AS experiences,
  
  CASE
    WHEN users.raw_user_meta_data ->> 'user_type' = 'farmer' THEN users.raw_user_meta_data ->> 'num_heads'
    ELSE NULL
  END AS num_heads,

  CASE
    WHEN users.raw_user_meta_data ->> 'user_type' = 'farmer' THEN users.raw_user_meta_data ->> 'experience_years'
    ELSE NULL
  END AS experience_years,

  CASE
    WHEN users.raw_user_meta_data ->> 'user_type' = 'farmer' THEN users.raw_user_meta_data ->> 'operations'
    ELSE NULL
  END AS operations
  
FROM auth.users;