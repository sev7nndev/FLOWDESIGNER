-- =====================================================
-- FLOW SAAS - RLS CLEANUP (Remove Duplicates)
-- =====================================================
-- Purpose: Remove ALL duplicate RLS policies
-- This script will drop ALL existing policies and recreate only the optimized ones
-- Run this FIRST, then run optimize_rls.sql
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =====================================================

-- APP_CONFIG
DROP POLICY IF EXISTS "Permitir que funções privilegiadas gerenciem a configuração do aplicativo" ON public.app_config;
DROP POLICY IF EXISTS "Permitir acesso público de leitura à configuração" ON public.app_config;
DROP POLICY IF EXISTS "Permitir leitura pública da configuração do aplicativo" ON public.app_config;
DROP POLICY IF EXISTS "Allow public read app config" ON public.app_config;
DROP POLICY IF EXISTS "Allow privileged roles to manage app config" ON public.app_config;

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "Acesso total ao chat para o proprietário/administrador" ON public.chat_messages;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Usuários podem visualizar o próprio chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Usuários podem visualizar suas próprias mensagens de chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Owner/Admin full chat access" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios chats" ON public.chat_messages;

-- IMAGES
DROP POLICY IF EXISTS "Os usuários podem inserir suas próprias imagens" ON public.images;
DROP POLICY IF EXISTS "Os usuários podem visualizar suas próprias imagens" ON public.images;
DROP POLICY IF EXISTS "Os usuários podem excluir suas próprias imagens" ON public.images;
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

-- PAYMENTS
DROP POLICY IF EXISTS "Acesso total aos pagamentos para o proprietário/administrador" ON public.payments;
DROP POLICY IF EXISTS "Os usuários podem visualizar seus próprios pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Owner/Admin full payments access" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- PLAN_DETAILS
DROP POLICY IF EXISTS "Permitir que funções privilegiadas gerenciem detalhes do plano" ON public.plan_details;
DROP POLICY IF EXISTS "Permitir acesso público de leitura aos detalhes do plano" ON public.plan_details;
DROP POLICY IF EXISTS "Permitir leitura pública dos detalhes do plano" ON public.plan_details;
DROP POLICY IF EXISTS "Allow public read plan details" ON public.plan_details;
DROP POLICY IF EXISTS "Allow privileged roles to manage plan details" ON public.plan_details;

-- PLAN_SETTINGS
DROP POLICY IF EXISTS "Permitir que funções privilegiadas gerenciem as configurações do plano" ON public.plan_settings;
DROP POLICY IF EXISTS "Permitir acesso público de leitura às configurações do plano" ON public.plan_settings;
DROP POLICY IF EXISTS "Permitir leitura pública das configurações do plano" ON public.plan_settings;
DROP POLICY IF EXISTS "Allow public read plan settings" ON public.plan_settings;
DROP POLICY IF EXISTS "Allow privileged roles to manage plan settings" ON public.plan_settings;

-- PROFILES
DROP POLICY IF EXISTS "O proprietário/administrador pode visualizar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Os usuários podem visualizar o próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Os usuários podem atualizar o próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner/Admin can view all profiles" ON public.profiles;

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Owner/Admin full subscriptions access" ON public.subscriptions;
DROP POLICY IF EXISTS "User manage own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Acesso total às assinaturas para o proprietário/administrador" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuário gerencia suas próprias assinaturas" ON public.subscriptions;

-- USER_USAGE
DROP POLICY IF EXISTS "O usuário seleciona seu próprio uso" ON public.user_usage;
DROP POLICY IF EXISTS "Os usuários podem visualizar seu próprio uso" ON public.user_usage;
DROP POLICY IF EXISTS "O usuário atualiza seu próprio uso" ON public.user_usage;
DROP POLICY IF EXISTS "Os usuários podem atualizar seu próprio uso" ON public.user_usage;
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.user_usage;

-- =====================================================
-- STEP 2: RECREATE OPTIMIZED POLICIES
-- =====================================================

-- 1. PROFILES
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

-- 2. IMAGES
CREATE POLICY "Users can view own images" 
  ON public.images FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own images" 
  ON public.images FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own images" 
  ON public.images FOR DELETE 
  USING ((select auth.uid()) = user_id);

-- 3. USER_USAGE
CREATE POLICY "Users can view own usage" 
  ON public.user_usage FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own usage" 
  ON public.user_usage FOR UPDATE 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own usage" 
  ON public.user_usage FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- 4. PAYMENTS
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

-- 5. SUBSCRIPTIONS
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

-- 6. PLAN_SETTINGS
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

-- 7. PLAN_DETAILS
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

-- 8. APP_CONFIG
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

-- 9. CHAT_MESSAGES (if table exists)
-- Note: Only create if chat_messages table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    -- Drop old policies
    EXECUTE 'DROP POLICY IF EXISTS "Owner/Admin full chat access" ON public.chat_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own chat" ON public.chat_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own chat" ON public.chat_messages';
    
    -- Create new policies (assuming chat_messages has sender_id column)
    EXECUTE 'CREATE POLICY "Users can view own chat" ON public.chat_messages FOR SELECT USING ((select auth.uid()) = sender_id)';
    EXECUTE 'CREATE POLICY "Users can insert own chat" ON public.chat_messages FOR INSERT WITH CHECK ((select auth.uid()) = sender_id)';
    EXECUTE 'CREATE POLICY "Owner/Admin full chat access" ON public.chat_messages FOR ALL USING ((select auth.uid()) IN (SELECT id FROM public.profiles WHERE role IN (''owner'', ''admin'', ''dev'')))';
    
    RAISE NOTICE '✅ Chat messages policies created';
  ELSE
    RAISE NOTICE '⚠️ chat_messages table does not exist, skipping';
  END IF;
END $$;

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

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ All duplicate RLS policies removed!';
  RAISE NOTICE '✅ Optimized policies recreated with (select auth.uid()) pattern';
  RAISE NOTICE '📊 Check verification query above - should show NO duplicates';
  RAISE NOTICE '⚠️ If you see policy_count > 1, there are still duplicates';
END $$;
