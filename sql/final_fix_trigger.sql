-- EMERGENCY FIX: Reset and Recreate User Trigger
-- 1. Clean up OLD mess (Use CASCADE to kill dependencies)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Define the Function (Verified Schema: user_usage uses current_usage)
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
  
  -- Create usage tracking (Corrected for current_usage column)
  INSERT INTO public.user_usage (user_id, plan_id, current_usage, cycle_start_date)
  VALUES (NEW.id, 'free', 0, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant permissions (Just to be safe)
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.user_usage TO postgres, service_role;

-- DONE.
