-- Drop the trigger that automatically creates a profile on sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function associated with the trigger
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Optional: Drop duplicate policy if it exists (cleanup)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";
