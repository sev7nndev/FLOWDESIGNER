
-- Redefine the handle_new_user function to be robust and ordered correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 1. Create Profile FIRST (Primary dependency usually)
  INSERT INTO public.profiles (id, email, first_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    COALESCE(new.raw_user_meta_data->>'role', 'free') -- Default to free if not set
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create User Usage (Dependent on Profile/User)
  INSERT INTO public.user_usage (user_id, images_generated)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Ensure the trigger is attached properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
