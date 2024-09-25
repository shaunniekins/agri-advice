-- add new bucket "profile_pictures" with mime type: "image/*""

-- add new policy for bucket "profile_pictures":
---- Choose "Get started quickly"
---- Choose: "Give users access to a folder only to authenticated users"
---- Policy name: Give users access to folder
---- Allowed operation: All
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- ((bucket_id = 'profile_pictures'::text) AND ((storage.foldername(name))[1] = 'public'::text) AND (auth.role() = 'authenticated'::text))

-- bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = 'public' AND auth.role() = 'authenticated'