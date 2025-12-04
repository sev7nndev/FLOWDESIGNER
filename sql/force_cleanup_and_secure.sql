-- FORCE CLEANUP AND SECURE (Corrigido para conflitos de nomes)
-- Execute este script no Supabase SQL Editor

-- 1. Habilitar RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 2. LIMPEZA TOTAL (Remove políticas antigas em Inglês e Português)

-- IMAGES
DROP POLICY IF EXISTS "Public read access" ON public.images;
DROP POLICY IF EXISTS "Select own images" ON public.images;
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Owner can view all images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;
-- Nomes em Português (Prováveis culpados do erro)
DROP POLICY IF EXISTS "Os usuários podem ver suas próprias imagens" ON public.images;
DROP POLICY IF EXISTS "Os usuários podem inserir suas próprias imagens" ON public.images;
DROP POLICY IF EXISTS "Os usuários podem deletar suas próprias imagens" ON public.images;
DROP POLICY IF EXISTS "Os usuários podem atualizar suas próprias imagens" ON public.images;

-- PAYMENTS
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Owner can view all payments" ON public.payments;
-- Nomes em Português
DROP POLICY IF EXISTS "Os usuários podem ver seus próprios pagamentos" ON public.payments;

-- USER USAGE
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Owner can view all usage" ON public.user_usage;
-- Nomes em Português
DROP POLICY IF EXISTS "Os usuários podem ver seu próprio uso" ON public.user_usage;


-- 3. CRIAR POLÍTICAS BLINDADAS DE PRIVACIDADE

-- IMAGES (Apenas o dono vê/cria/deleta)
CREATE POLICY "privacy_select_own_images" 
ON public.images FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "privacy_insert_own_images" 
ON public.images FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "privacy_delete_own_images" 
ON public.images FOR DELETE 
USING (auth.uid() = user_id);

-- PAYMENTS (Apenas o dono vê)
CREATE POLICY "privacy_select_own_payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

-- USER USAGE (Apenas o dono vê)
CREATE POLICY "privacy_select_own_usage" 
ON public.user_usage FOR SELECT 
USING (auth.uid() = user_id);


-- 4. PERMISSÃO DE ADM (Backend/Service Role ignora isso, mas usuários Admin logs precisam)
-- Esta política permite que usuários com role 'owner' ou 'admin' vejam tudo
CREATE POLICY "admin_view_all_images" 
ON public.images FOR SELECT 
USING (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('owner', 'admin', 'dev')
  )
);

CREATE POLICY "admin_view_all_payments" 
ON public.payments FOR SELECT 
USING (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('owner', 'admin', 'dev')
  )
);
