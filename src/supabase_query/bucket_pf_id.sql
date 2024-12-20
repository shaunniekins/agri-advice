-- add new bucket "pf_id_files" with mime type: "image/*"

-- add new policy for bucket "pf_id_files":
---- Choose "Get started quickly"
---- Choose: "Give users access to a folder only to authenticated users"
---- Policy name: Give users access to folder
---- Allowed operation: Select, Update, Delete
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- ((bucket_id = 'pf_id_files'::text) AND ((storage.foldername(name))[1] = 'public'::text) AND (auth.role() = 'authenticated'::text))

-- another: add new policy for bucket "pf_id_files":
---- Choose "Get started quickly"
---- Choose: "Give users access to a folder only to authenticated users"
---- Rename Policy name: Give users insert access to folder
---- Allowed operation: Insert
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- bucket_id = 'pf_id_files' AND (storage.foldername(name))[1] = 'public'