-- SOLUÇÃO DEFINITIVA: RLS que FUNCIONA
-- Este script cria policies que realmente funcionam com o Supabase JS Client

-- 1. Limpar TODAS as policies antigas
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;
DROP POLICY IF EXISTS "allow_authenticated_select" ON public.images;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.images;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON public.images;
DROP POLICY IF EXISTS "images_select_policy" ON public.images;
DROP POLICY IF EXISTS "images_insert_policy" ON public.images;
DROP POLICY IF EXISTS "images_delete_policy" ON public.images;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- 3. Criar policies SIMPLES que funcionam
-- IMPORTANTE: Usar auth.uid() diretamente, SEM subquery

CREATE POLICY "enable_read_own_images"
ON public.images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "enable_insert_own_images"
ON public.images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enable_delete_own_images"
ON public.images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Verificar se as policies foram criadas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'images' AND schemaname = 'public'
ORDER BY policyname;

-- 5. Testar query (substitua o UUID pelo seu user_id)
-- SELECT COUNT(*) FROM images WHERE user_id = '3cbe6759-6873-4192-9029-692f13133495';
