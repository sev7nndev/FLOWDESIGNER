-- Verificar se RLS está realmente desabilitado

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'images' AND schemaname = 'public';

-- Se rls_enabled = true, execute:
-- ALTER TABLE public.images DISABLE ROW LEVEL SECURITY;

-- Depois verifique novamente:
-- SELECT rowsecurity FROM pg_tables WHERE tablename = 'images';
