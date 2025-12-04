-- ENCONTRADO O CULPADO!
-- Vamos remover TODOS os gatilhos antigos e deixar apenas o correto.

-- 1. Remove o gatilho "zumbi" que está causando o erro
DROP TRIGGER IF EXISTS on_auth_user_created_create_subscription ON auth.users CASCADE;

-- 2. Remove o gatilho padrão para garantir que vamos recriar do zero limpo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Recria a FUNÇÃO CORRETA (cria profile e tabela de uso limpa)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'free'
  );
  
  -- Create usage tracking (Usando current_usage e plan_id corretos)
  INSERT INTO public.user_usage (user_id, plan_id, current_usage, cycle_start_date)
  VALUES (NEW.id, 'free', 0, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recria o ÚNICO gatilho necessário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Garante permissões
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.user_usage TO postgres, service_role;

-- Agora deve funcionar!
