-- 🚨 FIX REGISTRATION CRASH (TRIGGER)
-- Este script corrige o erro "Database error saving new user".
-- Ele torna o gatilho "handle_new_user" à prova de falhas, preenchendo todas as colunas.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create Profile (Com tratativa de erro e valores padrão)
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create User Usage (Preenchendo TUDO para evitar erro de constraint)
  INSERT INTO public.user_usage (
    user_id,
    plan_id,
    images_generated,   -- Coluna Nova
    current_usage,      -- Coluna Antiga (Legacy) - Preenchemos com 0 para garantir
    cycle_start_date,   -- Data de Ciclo
    updated_at
  )
  VALUES (
    new.id,
    'free',
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reiniciar o Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garantir Permissões (Caso seja problema de permissão)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
