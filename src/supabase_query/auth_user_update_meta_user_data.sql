UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
                            jsonb_set(raw_user_meta_data, '{first_name}', '"John"', true),
                            '{last_name}', '"Doe"', true)
WHERE id = '16ff7fbc-da5f-42aa-bfe4-c6856a00abcc';
