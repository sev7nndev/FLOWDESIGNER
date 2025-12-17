-- TESTE ESPECÍFICO: Verificar acesso do usuário marcos@gmail.com
-- User ID: 3cbe6759-6873-4192-9029-692f13133495

-- 1. Verificar quantas imagens esse usuário tem (com SERVICE ROLE - sem RLS)
SELECT COUNT(*) as total_images
FROM images
WHERE user_id = '3cbe6759-6873-4192-9029-692f13133495';

-- 2. Ver as policies que afetam essa tabela
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'images' AND schemaname = 'public';

-- 3. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'images' AND schemaname = 'public';

-- 4. SOLUÇÃO TEMPORÁRIA: Desabilitar RLS para testar
-- ATENÇÃO: Isso permite que TODOS vejam TODAS as imagens!
-- Use APENAS para confirmar que o problema é o RLS

ALTER TABLE public.images DISABLE ROW LEVEL SECURITY;

-- Depois de testar no navegador, REABILITE:
-- ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
