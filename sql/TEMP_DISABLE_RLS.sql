-- SOLUÇÃO ALTERNATIVA: Desabilitar RLS temporariamente
-- ATENÇÃO: Use isso APENAS em desenvolvimento!
-- Em produção, você PRECISA do RLS para segurança

-- Opção 1: Desabilitar RLS (TEMPORÁRIO - APENAS PARA TESTE)
ALTER TABLE public.images DISABLE ROW LEVEL SECURITY;

-- Para reabilitar depois:
-- ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Opção 2: Criar policy mais permissiva (RECOMENDADO)
-- Primeiro, limpar todas as policies existentes
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

-- Habilitar RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Criar policy SIMPLES que funciona
CREATE POLICY "allow_authenticated_select"
ON public.images
FOR SELECT
TO authenticated
USING (true);  -- Permite todos os usuários autenticados verem TODAS as imagens (TEMPORÁRIO)

CREATE POLICY "allow_authenticated_insert"
ON public.images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_delete"
ON public.images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- IMPORTANTE: Esta policy permite que usuários vejam imagens de OUTROS usuários!
-- Use APENAS para testar se o problema é o RLS
-- Depois, volte para a policy correta com: auth.uid() = user_id
