-- =====================================================
-- FLOW SAAS - RLS OPTIMIZATION
-- =====================================================
-- Purpose: Optimize Row Level Security policies for performance
-- Pattern: Use (select auth.uid()) instead of auth.uid()
-- Why: Prevents re-evaluation of auth.uid() for each row
-- Run this in Supabase SQL Editor
-- Estimated time: < 1 minute
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner/Admin can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles
  FOR SELECT 
  USING ((select auth.uid()) = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE 
  USING ((select auth.uid()) = id);

-- Owner/Admin can view all profiles
CREATE POLICY "Owner/Admin can view all profiles" 
  ON public.profiles
  FOR SELECT 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 2. IMAGES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

-- Users can view their own images
CREATE POLICY "Users can view own images" 
  ON public.images
  FOR SELECT 
  USING ((select auth.uid()) = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert own images" 
  ON public.images
  FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete own images" 
  ON public.images
  FOR DELETE 
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 3. USER_USAGE TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.user_usage;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" 
  ON public.user_usage
  FOR SELECT 
  USING ((select auth.uid()) = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own usage" 
  ON public.user_usage
  FOR UPDATE 
  USING ((select auth.uid()) = user_id);

-- Users can insert their own usage record
CREATE POLICY "Users can insert own usage" 
  ON public.user_usage
  FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- =====================================================
-- 4. PAYMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Owner/Admin full payments access" ON public.payments;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" 
  ON public.payments
  FOR SELECT 
  USING ((select auth.uid()) = user_id);

-- Owner/Admin can view all payments
CREATE POLICY "Owner/Admin full payments access" 
  ON public.payments
  FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- =====================================================
-- 5. SUBSCRIPTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "User manage own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owner/Admin full subscriptions access" ON public.subscriptions;

-- Users can manage their own subscriptions
CREATE POLICY "User manage own subscriptions" 
  ON public.subscriptions
  FOR ALL 
  USING ((select auth.uid()) = user_id);

-- Owner/Admin can manage all subscriptions
CREATE POLICY "Owner/Admin full subscriptions access" 
  ON public.subscriptions
  FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- =====================================================
-- 6. PLAN_SETTINGS TABLE (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Allow public read plan settings" ON public.plan_settings;
DROP POLICY IF EXISTS "Allow privileged roles to manage plan settings" ON public.plan_settings;

-- Public can read plan settings
CREATE POLICY "Allow public read plan settings" 
  ON public.plan_settings
  FOR SELECT 
  USING (true);

-- Owner/Admin/Dev can manage plan settings
CREATE POLICY "Allow privileged roles to manage plan settings" 
  ON public.plan_settings
  FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- =====================================================
-- 7. PLAN_DETAILS TABLE (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Allow public read plan details" ON public.plan_details;
DROP POLICY IF EXISTS "Allow privileged roles to manage plan details" ON public.plan_details;

-- Public can read plan details
CREATE POLICY "Allow public read plan details" 
  ON public.plan_details
  FOR SELECT 
  USING (true);

-- Owner/Admin/Dev can manage plan details
CREATE POLICY "Allow privileged roles to manage plan details" 
  ON public.plan_details
  FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- =====================================================
-- 8. APP_CONFIG TABLE (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "Allow public read app config" ON public.app_config;
DROP POLICY IF EXISTS "Allow privileged roles to manage app config" ON public.app_config;

-- Public can read app config
CREATE POLICY "Allow public read app config" 
  ON public.app_config
  FOR SELECT 
  USING (true);

-- Owner/Admin/Dev can manage app config
CREATE POLICY "Allow privileged roles to manage app config" 
  ON public.app_config
  FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all policies were created successfully

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 
    'images', 
    'user_usage', 
    'payments', 
    'subscriptions',
    'plan_settings',
    'plan_details',
    'app_config'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies optimized successfully!';
  RAISE NOTICE '✅ All policies now use (select auth.uid()) pattern';
  RAISE NOTICE '✅ Performance improved for row-level security checks';
  RAISE NOTICE '📊 Run the verification query above to confirm';
END $$;
