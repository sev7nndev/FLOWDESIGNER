-- ========================================
-- HABILITAR RLS NA TABELA IMAGES
-- ========================================
-- Este script configura Row Level Security para garantir
-- que cada usuário só veja suas próprias imagens

-- 1. Habilitar RLS na tabela
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can update own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

-- 3. Criar política de SELECT (visualização)
CREATE POLICY "Users can view own images"
ON public.images
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Criar política de INSERT (criação)
CREATE POLICY "Users can insert own images"
ON public.images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Criar política de UPDATE (atualização)
CREATE POLICY "Users can update own images"
ON public.images
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Criar política de DELETE (exclusão)
CREATE POLICY "Users can delete own images"
ON public.images
FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- Execute esta query para confirmar que RLS está ativo:

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'images';

-- Deve retornar: rls_enabled = true

-- ========================================
-- TESTE
-- ========================================
-- Faça login no app e tente carregar o histórico
-- Se funcionar, RLS está configurado corretamente!
