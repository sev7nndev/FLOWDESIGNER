-- =====================================================
-- FLOW SAAS - PERFORMANCE INDEXES
-- =====================================================
-- Purpose: Add performance indexes to critical tables
-- Run this in Supabase SQL Editor
-- Estimated time: < 30 seconds
-- =====================================================

-- 1. IMAGES TABLE
-- Most common query: Get user's images sorted by date
CREATE INDEX IF NOT EXISTS idx_images_user_created 
  ON public.images(user_id, created_at DESC);

COMMENT ON INDEX idx_images_user_created IS 
  'Optimizes gallery queries: SELECT * FROM images WHERE user_id = X ORDER BY created_at DESC';

-- 2. PAYMENTS TABLE
-- Common queries: User payment history, webhook lookups
CREATE INDEX IF NOT EXISTS idx_payments_user 
  ON public.payments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_mp_id 
  ON public.payments(mercadopago_payment_id) 
  WHERE mercadopago_payment_id IS NOT NULL;

COMMENT ON INDEX idx_payments_user IS 
  'Optimizes payment history queries for users';

COMMENT ON INDEX idx_payments_mp_id IS 
  'Optimizes webhook payment lookups by Mercado Pago ID';

-- 3. USER_USAGE TABLE
-- Most common query: Quota checks
CREATE INDEX IF NOT EXISTS idx_user_usage_user 
  ON public.user_usage(user_id);

COMMENT ON INDEX idx_user_usage_user IS 
  'Optimizes quota check queries: SELECT * FROM user_usage WHERE user_id = X';

-- 4. SUBSCRIPTIONS TABLE
-- Common query: Active subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON public.subscriptions(user_id, status);

COMMENT ON INDEX idx_subscriptions_user_status IS 
  'Optimizes active subscription queries: WHERE user_id = X AND status = active';

-- =====================================================
-- ADD MISSING RLS POLICY
-- =====================================================

-- Images DELETE policy (allows users to delete own images)
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

CREATE POLICY "Users can delete own images" 
  ON public.images 
  FOR DELETE 
  USING ((select auth.uid()) = user_id);

COMMENT ON POLICY "Users can delete own images" ON public.images IS 
  'Allows users to delete their own generated images';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all indexes were created successfully

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('images', 'payments', 'user_usage', 'subscriptions')
ORDER BY tablename, indexname;

-- Expected output: 5 indexes
-- ✅ idx_images_user_created
-- ✅ idx_payments_user
-- ✅ idx_payments_mp_id
-- ✅ idx_user_usage_user
-- ✅ idx_subscriptions_user_status

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Performance indexes created successfully!';
  RAISE NOTICE '✅ RLS DELETE policy added for images table';
  RAISE NOTICE '📊 Run the verification query above to confirm';
END $$;
