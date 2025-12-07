-- =====================================================
-- CONFIGURAR OWNER DO SAAS
-- Email: lucasformaggio@gmail.com
-- =====================================================

-- Passo 1: Verificar se o usuário já existe
SELECT 
  u.id,
  u.email,
  p.role,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'lucasformaggio@gmail.com';

-- Passo 2: Se o usuário existir, atualizar para owner
UPDATE profiles 
SET role = 'owner',
    updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'lucasformaggio@gmail.com');

-- Passo 3: Verificar a atualização
SELECT 
  u.id,
  u.email,
  p.role,
  p.first_name,
  p.last_name,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'lucasformaggio@gmail.com';

-- =====================================================
-- IMPORTANTE: Se o usuário NÃO existir ainda
-- =====================================================
-- Você precisará:
-- 1. Criar a conta manualmente no app (Sign Up)
-- 2. Depois executar o UPDATE acima
-- 
-- OU criar diretamente via SQL (avançado):
-- 
-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'lucasformaggio@gmail.com',
--   crypt('SUA_SENHA_AQUI', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Confirmar que o owner está configurado corretamente
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.role = 'owner'
ORDER BY p.created_at DESC;
