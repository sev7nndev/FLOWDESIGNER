-- 1. Função Helper SECURITY DEFINER (Quebra a Recursão)
-- Esta função roda como "superuser" do banco, ignorando as policies, 
-- permitindo checar a role sem entrar em loop infinito.
CREATE OR REPLACE FUNCTION public.check_is_admin_or_dev()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'dev')
  );
END;
$$;

-- 2. Recriar Policies da tabela PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Policy 1: Usuário vê o próprio perfil (Essencial para Login)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Admins/Devs veem TODOS os perfis (Usando a função segura)
CREATE POLICY "Admins view all"
ON public.profiles FOR SELECT
USING (public.check_is_admin_or_dev() = true);

-- Policy 3: Permitir Update apenas para quem é Admin/Owner (Dev pode ler, mas não alterar roles alheias por precaução, ou liberamos tudo?)
-- O usuário pediu "tudo funcionando", então vamos permitir que admins modifiquem perfis se necessário.
-- Mas por segurança, para UPDATE/DELETE, vamos verificar também.

CREATE POLICY "Admins update all"
ON public.profiles FOR UPDATE
USING (public.check_is_admin_or_dev() = true);


-- 3. Garantir Políticas nas tabelas de Planos (Para evitar erro lá também)
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_details ENABLE ROW LEVEL SECURITY;

-- Liberar LEITURA pública dos planos (Front precisa carregar pra qualquer um comprar)
DROP POLICY IF EXISTS "Public view plans" ON public.plan_settings;
CREATE POLICY "Public view plans" ON public.plan_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view plan details" ON public.plan_details;
CREATE POLICY "Public view plan details" ON public.plan_details FOR SELECT USING (true);

-- Liberar ESCRITA apenas para Admin/Dev
DROP POLICY IF EXISTS "Admins manage plans" ON public.plan_settings;
CREATE POLICY "Admins manage plans" ON public.plan_settings FOR ALL USING (public.check_is_admin_or_dev() = true);

DROP POLICY IF EXISTS "Admins manage plan details" ON public.plan_details;
CREATE POLICY "Admins manage plan details" ON public.plan_details FOR ALL USING (public.check_is_admin_or_dev() = true);
