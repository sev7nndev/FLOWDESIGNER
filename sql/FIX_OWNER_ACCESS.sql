-- 1. Garante que a role do Lucas é "owner"
UPDATE public.profiles
SET role = 'owner',
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'lucasformaggio@gmail.com'
);

-- 2. Garante que a role do Seven é "dev"
UPDATE public.profiles
SET role = 'dev',
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'sevenbeatx@gmail.com'
);

-- 3. Verifica e corrige RLS Policies na tabela profiles
-- Habilita RLS se não estiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove policy antiga de leitura se existir para recriar correta
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Cria policy permissiva: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Cria policy para ADMIN/OWNER ver todos (Necessário para o Painel carregar a lista de usuarios)
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
CREATE POLICY "Owners can view all profiles"
ON public.profiles FOR SELECT
USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin', 'dev')
  )
);
