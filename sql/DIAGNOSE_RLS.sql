-- DIAGNÓSTICO: Verificar se as policies foram criadas corretamente
-- Execute este script no Supabase SQL Editor para diagnosticar o problema

-- 1. Verificar se RLS está habilitado na tabela images
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'images' AND schemaname = 'public';

-- 2. Listar TODAS as policies da tabela images
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'images' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Testar query como usuário autenticado
-- IMPORTANTE: Substitua 'SEU_USER_ID' pelo ID do usuário marcos@gmail.com
-- Para pegar o ID, execute: SELECT id FROM auth.users WHERE email = 'marcos@gmail.com';

-- Primeiro, pegue o user_id:
SELECT id, email FROM auth.users WHERE email = 'marcos@gmail.com';

-- Depois, teste a query (substitua o ID):
-- SELECT COUNT(*) FROM images WHERE user_id = 'ID_DO_USUARIO_AQUI';
