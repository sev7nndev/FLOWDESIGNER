
-- Garantir que os planos existam
INSERT INTO public.plan_settings (id, display_name, description, price, max_images_per_month, features)
VALUES 
('free', 'Gratuito', 'Para começar', 0, 5, ARRAY['5 Imagens/mês', 'Geração Padrão']),
('starter', 'Starter', 'Para pequenos negócios', 29.90, 50, ARRAY['50 Imagens/mês', 'Suporte Básico']),
('pro', 'Pro', 'Ilimitado para profissionais', 97.00, 9999, ARRAY['Imagens Ilimitadas', 'Suporte Prioritário'])
ON CONFLICT (id) DO UPDATE SET
display_name = EXCLUDED.display_name,
price = EXCLUDED.price; -- Garante atualização se já existir
