-- FIX: Enable RLS policies for images table
-- This ensures users can view their own images

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

-- 2. Ensure RLS is enabled
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- 3. Create SELECT policy (view own images)
CREATE POLICY "Users can view own images"
ON public.images
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create INSERT policy (create own images)
CREATE POLICY "Users can insert own images"
ON public.images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Create DELETE policy (delete own images)
CREATE POLICY "Users can delete own images"
ON public.images
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'images';
