
-- 1. Remover TODAS as políticas antigas de profiles para limpar o lixo recursivo
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
-- (Qualquer outra política que possa existir)

-- 2. Recriar Políticas Seguras em profiles
-- Leitura: O próprio usuário pode ver SEU perfil
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Leitura: Owners e Admins podem ver TUDO (Usando get_my_role para evitar recursão)
CREATE POLICY "Admins/Owners view all" ON public.profiles 
FOR SELECT USING (
  public.get_my_role() IN ('owner', 'admin', 'dev')
);

-- Escrita: O próprio usuário pode atualizar SEU perfil
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- 3. Corrigir Recursão em plan_settings também
ALTER TABLE public.plan_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read plans" ON public.plan_settings;
CREATE POLICY "Public read plans" ON public.plan_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner update plans" ON public.plan_settings;
-- AQUI ESTAVA O PERIGO: Em vez de subquery, usamos a função segura
CREATE POLICY "Owner update plans" ON public.plan_settings 
FOR UPDATE USING (
  public.get_my_role() = 'owner'
);

GRANT ALL ON public.plan_settings TO authenticated;
GRANT SELECT ON public.plan_settings TO anon;
