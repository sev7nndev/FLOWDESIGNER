-- File contents excluded from context

-- 1. Enable RLS on the storage.objects table (if not already enabled)
-- This function is idempotent and safe to run.
SELECT public.enable_storage_rls_if_needed();

-- 2. Create a policy to allow authenticated users to SELECT (read/download) files 
-- ONLY if the file path starts with their user ID (auth.uid()).
-- The path structure is assumed to be 'user_id/filename.png'
DROP POLICY IF EXISTS "Allow authenticated read access to own files" ON storage.objects;
CREATE POLICY "Allow authenticated read access to own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  -- The path_tokens array contains the segments of the file path.
  -- The first segment (index 1) must match the user's ID.
  (storage.foldername(name))[1] = auth.uid()
);

-- 3. Create a policy to allow authenticated users to INSERT (upload) files 
-- ONLY if the file path starts with their user ID.
DROP POLICY IF EXISTS "Allow authenticated insert access to own files" ON storage.objects;
CREATE POLICY "Allow authenticated insert access to own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  (storage.foldername(name))[1] = auth.uid()
);

-- 4. Create a policy to allow authenticated users to UPDATE (overwrite) files 
-- ONLY if the file path starts with their user ID.
DROP POLICY IF EXISTS "Allow authenticated update access to own files" ON storage.objects;
CREATE POLICY "Allow authenticated update access to own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  (storage.foldername(name))[1] = auth.uid()
);

-- 5. Create a policy to allow authenticated users to DELETE their own files.
DROP POLICY IF EXISTS "Allow authenticated delete access to own files" ON storage.objects;
CREATE POLICY "Allow authenticated delete access to own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  (storage.foldername(name))[1] = auth.uid()
);