-- FIX: Update handle_new_user to use correct columns (current_usage)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'free'
  );
  
  -- Create usage tracking (Fixed: uses current_usage instead of images_generated)
  INSERT INTO public.user_usage (user_id, current_usage, plan_id, cycle_start_date)
  VALUES (NEW.id, 0, 'free', NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (Just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_usage TO anon, authenticated;
