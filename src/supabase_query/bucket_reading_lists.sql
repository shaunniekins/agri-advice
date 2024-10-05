-- add new bucket "reading_lists" with mime type: "application/pdf""

-- add new policy for bucket "reading_lists":
---- Choose "Get started quickly"
---- Choose: "Give users access to a folder only to authenticated users"
---- Policy name: Give users access to folder
---- Allowed operation: All
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = 'public' AND auth.role() = 'authenticated'