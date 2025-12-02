-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'free' CHECK (role IN ('free', 'starter', 'pro', 'admin', 'dev', 'owner')),
  status TEXT DEFAULT 'on' CHECK (status IN ('on', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  image_quota INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  mp_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User usage tracking
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_usage INTEGER DEFAULT 0,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image generations tracking
CREATE TABLE IF NOT EXISTS image_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT,
  image_url TEXT,
  business_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App configuration
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View for profiles with email
CREATE OR REPLACE VIEW profiles_with_email AS
SELECT 
  p.*,
  u.email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Insert default plans
INSERT INTO plans (name, price, image_quota) VALUES
  ('Free', 0, 3),
  ('Starter', 29.99, 20),
  ('Pro', 49.99, 50)
ON CONFLICT (name) DO NOTHING;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- User usage policies
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (user_id = auth.uid());

-- Image generations policies
CREATE POLICY "Users can view own generations" ON image_generations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generations" ON image_generations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Images policies
CREATE POLICY "Users can view own images" ON images
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own images" ON images
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own images" ON images
  FOR UPDATE USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- App config policies (only service role can modify)
CREATE POLICY "Anyone can view app config" ON app_config
  FOR SELECT USING (true);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update usage
CREATE OR REPLACE FUNCTION update_monthly_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_usage (user_id, current_usage, month, year)
  VALUES (NEW.user_id, 1, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()))
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    current_usage = user_usage.current_usage + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage on image generation
CREATE TRIGGER update_usage_on_generation
  AFTER INSERT ON image_generations
  FOR EACH ROW EXECUTE FUNCTION update_monthly_usage();

-- Storage bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-arts', 'generated-arts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-arts' AND
    auth.uid()::text = (SPLIT_PART(name, '/', 1))
  );

CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-arts' AND
    auth.uid()::text = (SPLIT_PART(name, '/', 1))
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON chat_messages(recipient_id);