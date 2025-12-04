-- Flow Designer - Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'free' CHECK (role IN ('free', 'starter', 'pro', 'admin', 'owner', 'dev')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Create user_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  images_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on user_usage
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
CREATE POLICY "Users can view own usage" 
  ON public.user_usage FOR SELECT 
  USING (auth.uid() = user_id);

-- 6. Create images table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  business_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS on images
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own images" ON public.images;
CREATE POLICY "Users can view own images" 
  ON public.images FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
CREATE POLICY "Users can insert own images" 
  ON public.images FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 8. Create plan_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plan_settings (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  max_images_per_month INTEGER NOT NULL,
  features TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Insert default plans
INSERT INTO public.plan_settings (id, display_name, price, max_images_per_month, features, description)
VALUES 
  ('free', 'Free', 0, 5, ARRAY['5 imagens por mês', 'Qualidade básica', 'Suporte por email'], 'Ideal para testar'),
  ('starter', 'Starter', 29.90, 100, ARRAY['100 imagens por mês', 'Alta qualidade', 'Suporte prioritário', 'Sem marca d''água'], 'Perfeito para começar'),
  ('pro', 'Pro', 79.90, 1000, ARRAY['1000 imagens por mês', 'Qualidade premium', 'Suporte VIP', 'API access', 'Geração em lote'], 'Para profissionais')
ON CONFLICT (id) DO NOTHING;

-- 10. Create app_config table for Mercado Pago tokens
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create function to handle new user
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
  
  -- Create usage tracking
  INSERT INTO public.user_usage (user_id, images_generated)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_usage TO anon, authenticated;
GRANT ALL ON public.images TO anon, authenticated;
GRANT SELECT ON public.plan_settings TO anon, authenticated;
GRANT ALL ON public.app_config TO authenticated;

-- Done! Your database is ready.
