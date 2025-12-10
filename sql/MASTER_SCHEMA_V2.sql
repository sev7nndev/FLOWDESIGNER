-- MASTER SCHEMA V2 (FLOW SAAS)
-- Data: 07/12/2025
-- Autor: Auditoria Técnica IA
-- Objetivo: Unificar e corrigir toda a estrutura do banco de dados em UM único script confiável.
-- Instruções: Rode este script no SQL Editor do Supabase para consertar seu banco.

-- ==========================================
-- 1. LIMPEZA E PREPARAÇÃO (Safe Mode)
-- ==========================================

-- Remover triggers antigas conflitantes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ==========================================
-- 2. TABELAS PRINCIPAIS (Estrutura)
-- ==========================================

-- Tabela: Profiles (Dados do usuário)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  role TEXT DEFAULT 'free' CHECK (role IN ('free', 'starter', 'pro', 'admin', 'owner', 'dev')),
  plan TEXT DEFAULT 'free', -- Redundância útil
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: User Usage (Controle de Créditos)
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  images_generated INTEGER DEFAULT 0, -- NOME CORRETO (Backend usa este)
  plan_id TEXT DEFAULT 'free',
  cycle_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GARANTIA: Adicionar colunas caso a tabela já exista (FALHA CORRIGIDA)
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS images_generated INTEGER DEFAULT 0;
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS cycle_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Consertar se tiver coluna errada 'current_usage' (Migração)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_usage' AND column_name = 'current_usage') THEN
        UPDATE public.user_usage SET images_generated = current_usage WHERE images_generated IS NULL OR images_generated = 0;
        -- Não dropamos a coluna para evitar perda de dados por segurança, mas o sistema vai ignorar
    END IF;
END $$;

-- Tabela: Plan Settings (Preços e Limites)
CREATE TABLE IF NOT EXISTS public.plan_settings (
  id TEXT PRIMARY KEY, -- 'free', 'starter', 'pro'
  display_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  max_images_per_month INTEGER NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GARANTIA: Adicionar colunas em plan_settings caso já exista antiga (CORREÇÃO DE ERRO)
ALTER TABLE public.plan_settings ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';
ALTER TABLE public.plan_settings ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.plan_settings ADD COLUMN IF NOT EXISTS max_images_per_month INTEGER DEFAULT 0;
ALTER TABLE public.plan_settings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.plan_settings ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- Tabela: Payments (Histórico)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  mercadopago_payment_id TEXT UNIQUE,
  plan TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Images (Galeria de Artes Geradas)
CREATE TABLE IF NOT EXISTS public.images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT,
  image_url TEXT, -- Base64 ou URL pública
  business_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Landing Carousel Images
CREATE TABLE IF NOT EXISTS public.landing_carousel_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Owners Payment Accounts (Mercado Pago)
CREATE TABLE IF NOT EXISTS public.owners_payment_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mp_access_token TEXT,
  mp_public_key TEXT,
  mp_refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. DADOS PADRÃO (Planos e Preços Corretos)
-- ==========================================

INSERT INTO public.plan_settings (id, display_name, price, max_images_per_month, description, features)
VALUES 
  ('free', 'Free', 0.00, 3, 'Para testar', ARRAY['3 gerações/mês', 'Qualidade padrão']),
  ('starter', 'Starter', 29.99, 20, 'Para começar', ARRAY['20 gerações/mês', 'Uso comercial', 'Suporte']),
  ('pro', 'Pro', 49.99, 50, 'Profissional', ARRAY['50 gerações/mês', 'Prioridade total', 'Alta resolução'])
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  max_images_per_month = EXCLUDED.max_images_per_month,
  description = EXCLUDED.description;

-- ==========================================
-- 4. AUTOMAÇÃO (Triggers e Functions)
-- ==========================================

-- Função: Criar Perfil e Usage automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Criar Profile
  INSERT INTO public.profiles (id, first_name, last_name, role, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'free',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Criar Usage (com images_generated = 0)
  INSERT INTO public.user_usage (user_id, images_generated, plan_id, cycle_start_date)
  VALUES (NEW.id, 0, 'free', NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função Segura: Obter Role (Bypass RLS para o próprio usuário)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Busca role independente de RLS (Security Definer)
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Ligar a função ao evento de Insert no Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. SEGURANÇA (RLS Policies)
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura/Escrita Própria
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
CREATE POLICY "Users can view own usage" ON public.user_usage FOR SELECT USING (auth.uid() = user_id);

-- Políticas para Imagens (Cada um vê as suas)
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
CREATE POLICY "Users can view own images" ON public.images FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
CREATE POLICY "Users can insert own images" ON public.images FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own images" ON public.images;
CREATE POLICY "Users can delete own images" ON public.images FOR DELETE USING (auth.uid() = user_id);

-- Permitir leitura pública de Planos
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read plans" ON public.plan_settings;
CREATE POLICY "Public read plans" ON public.plan_settings FOR SELECT TO anon, authenticated USING (true);

-- Permissões Gerais
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_usage TO anon, authenticated;
GRANT ALL ON public.plan_settings TO anon, authenticated;
GRANT ALL ON public.payments TO anon, authenticated;
GRANT ALL ON public.landing_carousel_images TO anon, authenticated;
GRANT ALL ON public.owners_payment_accounts TO anon, authenticated;
GRANT ALL ON public.images TO anon, authenticated;

-- FIM DO SCRIPT
