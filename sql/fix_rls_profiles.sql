-- Verifica políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Garante que o usuário possa ler seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Garante que o usuário possa atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Permite insert (caso precise criar perfil)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- CORREÇÃO CRÍTICA: Permite que o Service Role faça tudo (já é padrão, mas bom garantir)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
