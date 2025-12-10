-- Definir preço do plano Pro
UPDATE public.plan_settings
SET price = 49.99
WHERE id = 'pro';

-- Verificar resultado (mostrando todas as colunas)
SELECT * 
FROM public.plan_settings
ORDER BY price;
