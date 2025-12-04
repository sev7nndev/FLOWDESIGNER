-- ENFORCE STRICT PRIVACY (DATA ISOLATION)
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on critical tables
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 2. Drop insecure/orphaned policies
DROP POLICY IF EXISTS "Public read access" ON public.images;
DROP POLICY IF EXISTS "Select own images" ON public.images;
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Owner can view all images" ON public.images;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Owner can view all payments" ON public.payments;

DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Owner can view all usage" ON public.user_usage;

-- 3. Create Strict Policies (User can ONLY see their own data)

-- IMAGES
CREATE POLICY "Users can view own images" 
ON public.images FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" 
ON public.images FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" 
ON public.images FOR DELETE 
USING (auth.uid() = user_id);

-- PAYMENTS
CREATE POLICY "Users can view own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

-- USER USAGE
CREATE POLICY "Users can view own usage" 
ON public.user_usage FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Owner Override (Optional - prefer using Admin API)
-- Allows Owner/Dev/Admin to see everything via standard client if needed, 
-- but we recommend fetching via Admin API for security.
CREATE POLICY "Admins can view all images" 
ON public.images FOR SELECT 
USING (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('owner', 'admin', 'dev')
  )
);

CREATE POLICY "Admins can view all payments" 
ON public.payments FOR SELECT 
USING (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('owner', 'admin', 'dev')
  )
);
