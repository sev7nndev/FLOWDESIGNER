-- UPDATE PLAN SETTINGS TO MATCH USER REQUIREMENTS

-- 1. Free Plan (3 Images)
INSERT INTO plan_settings (id, display_name, description, features, price, max_images_per_month)
VALUES ('free', 'Plano Grátis', 'Para começar', ARRAY['3 gerações gratuitas', 'Acesso básico'], 0, 3)
ON CONFLICT (id) DO UPDATE SET
  max_images_per_month = 3,
  description = 'Para começar';

-- 2. Starter Plan (20 Images, R$ 29.99)
INSERT INTO plan_settings (id, display_name, description, features, price, max_images_per_month)
VALUES ('starter', 'Plano Starter', 'Ideal para pequenos negócios', ARRAY['20 gerações/mês', 'Sem marca d''água', 'Suporte prioritário'], 29.99, 20)
ON CONFLICT (id) DO UPDATE SET
  max_images_per_month = 20,
  price = 29.99,
  display_name = 'Plano Starter';

-- 3. Pro Plan (50 Images, R$ 49.99)
INSERT INTO plan_settings (id, display_name, description, features, price, max_images_per_month)
VALUES ('pro', 'Plano Pro', 'Para uso profissional', ARRAY['50 gerações/mês', 'Alta Definição', 'Acesso antecipado'], 49.99, 50)
ON CONFLICT (id) DO UPDATE SET
  max_images_per_month = 50,
  price = 49.99,
  display_name = 'Plano Pro';

-- 4. Ensure Cycle Reset Logic Exists (This logic is usually in the backend code, but let's confirm usage table exists)
CREATE TABLE IF NOT EXISTS user_usage (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  images_generated INT DEFAULT 0,
  cycle_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
