-- add new bucket "chat-images" with mime type: "image/*""

-- add new policy for bucket "chat-images":
---- Choose "Get started quickly"
---- Choose: "Give users access to a folder only to authenticated users"
---- Policy name: Give users access to folder
---- Allowed operation: All excluding update
---- Target roles: (Defaults to all (public) roles if none selected)
---- WITH CHECK expression: 
------- bucket_id = 'chat-images' AND (storage.foldername(name))[1] = 'public' AND auth.role() = 'authenticated'