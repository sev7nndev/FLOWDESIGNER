-- =====================================================
-- FLOW SAAS - FORCE CLEANUP (Remove ALL Policies)
-- =====================================================
-- Purpose: FORCE remove ALL RLS policies and recreate clean
-- This is more aggressive - drops EVERYTHING first
-- =====================================================

-- =====================================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- =====================================================
-- This allows us to work without policy conflicts

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP ALL POLICIES (FORCE)
-- =====================================================

-- Get all policy names and drop them
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 'images', 'user_usage', 'payments', 
        'subscriptions', 'plan_settings', 'plan_details', 'app_config'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
  END LOOP;
END $$;

-- =====================================================
-- STEP 3: RE-ENABLE RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE CLEAN POLICIES
-- =====================================================

-- 1. PROFILES (3 policies)
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING ((select auth.uid()) = id);

CREATE POLICY "Owner/Admin can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin')
    )
  );

-- 2. IMAGES (3 policies)
CREATE POLICY "Users can view own images" 
  ON public.images FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own images" 
  ON public.images FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own images" 
  ON public.images FOR DELETE 
  USING ((select auth.uid()) = user_id);

-- 3. USER_USAGE (3 policies)
CREATE POLICY "Users can view own usage" 
  ON public.user_usage FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own usage" 
  ON public.user_usage FOR UPDATE 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own usage" 
  ON public.user_usage FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- 4. PAYMENTS (2 policies)
CREATE POLICY "Users can view own payments" 
  ON public.payments FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Owner/Admin full payments access" 
  ON public.payments FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- 5. SUBSCRIPTIONS (2 policies)
CREATE POLICY "User manage own subscriptions" 
  ON public.subscriptions FOR ALL 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Owner/Admin full subscriptions access" 
  ON public.subscriptions FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- 6. PLAN_SETTINGS (2 policies)
CREATE POLICY "Allow public read plan settings" 
  ON public.plan_settings FOR SELECT 
  USING (true);

CREATE POLICY "Allow privileged roles to manage plan settings" 
  ON public.plan_settings FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- 7. PLAN_DETAILS (2 policies)
CREATE POLICY "Allow public read plan details" 
  ON public.plan_details FOR SELECT 
  USING (true);

CREATE POLICY "Allow privileged roles to manage plan details" 
  ON public.plan_details FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- 8. APP_CONFIG (2 policies)
CREATE POLICY "Allow public read app config" 
  ON public.app_config FOR SELECT 
  USING (true);

CREATE POLICY "Allow privileged roles to manage app config" 
  ON public.app_config FOR ALL 
  USING (
    (select auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'dev')
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
  tablename,
  policyname,
  cmd,
  COUNT(*) OVER (PARTITION BY tablename, cmd) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'images', 'user_usage', 'payments', 
    'subscriptions', 'plan_settings', 'plan_details', 'app_config'
  )
ORDER BY tablename, cmd, policyname;

-- Expected: ALL policy_count should be 1

-- =====================================================
-- COUNT SUMMARY
-- =====================================================

SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'images', 'user_usage', 'payments', 
    'subscriptions', 'plan_settings', 'plan_details', 'app_config'
  )
GROUP BY tablename
ORDER BY tablename;

-- Expected totals:
-- profiles: 3
-- images: 3
-- user_usage: 3
-- payments: 2
-- subscriptions: 2
-- plan_settings: 2
-- plan_details: 2
-- app_config: 2

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ ALL policies forcefully removed and recreated!';
  RAISE NOTICE '✅ Check verification queries above';
  RAISE NOTICE '✅ All policy_count should be 1';
END $$;
