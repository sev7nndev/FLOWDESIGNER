-- Flow Designer - Atualização de Preços e Tabelas do Owner

-- 1. Atualizar preços dos planos
UPDATE public.plan_settings
SET 
  price = 0.00,
  max_images_per_month = 3,
  description = 'Ideal para testar'
WHERE id = 'free';

UPDATE public.plan_settings
SET 
  price = 29.99,
  max_images_per_month = 20,
  description = 'Perfeito para começar'
WHERE id = 'starter';

UPDATE public.plan_settings
SET 
  price = 49.99,
  max_images_per_month = 50,
  description = 'Para profissionais'
WHERE id = 'pro';

-- 2. Criar tabela para rastrear assinaturas e pagamentos
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL,
  price_at_subscription NUMERIC(10,2) NOT NULL, -- Preço no momento da assinatura
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  mercadopago_subscription_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela para rastrear pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  mercadopago_payment_id TEXT UNIQUE,
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Adicionar campo para rastrear ciclo mensal
ALTER TABLE public.user_usage
ADD COLUMN IF NOT EXISTS cycle_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. Policies para subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- 7. Policies para payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" 
  ON public.payments FOR SELECT 
  USING (auth.uid() = user_id);

-- 8. Função para resetar quota mensal
CREATE OR REPLACE FUNCTION reset_monthly_quota()
RETURNS void AS $$
BEGIN
  -- Reset quota for users whose cycle has ended (30 days)
  UPDATE public.user_usage
  SET 
    images_generated = 0,
    last_reset_date = NOW(),
    cycle_start_date = NOW()
  WHERE 
    cycle_start_date < NOW() - INTERVAL '30 days';
    
  -- Delete old images (older than 30 days)
  DELETE FROM public.images
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Monthly quota reset completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Agendar reset mensal (se pg_cron estiver disponível)
-- SELECT cron.schedule(
--   'monthly-quota-reset',
--   '0 0 * * *', -- Diariamente à meia-noite
--   $$SELECT reset_monthly_quota()$$
-- );

-- 10. Grant permissions
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.payments TO authenticated;

-- Done!
SELECT 'Preços atualizados e tabelas criadas com sucesso!' AS status;
