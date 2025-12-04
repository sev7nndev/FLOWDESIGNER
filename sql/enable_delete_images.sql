-- Enable DELETE policy for images table
-- Allow users to delete their OWN images

-- 1. Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

-- 2. Create the DELETE policy
CREATE POLICY "Users can delete own images"
ON public.images
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Verify RLS is enabled on the table (it should be, but good to ensure)
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
