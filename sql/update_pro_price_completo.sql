-- ================================================
-- OPÇÃO 1: Atualizar e verificar (RECOMENDADO)
-- ================================================

-- Definir preço do plano Pro
UPDATE public.plan_settings
SET price = 49.99
WHERE id = 'pro';

-- Verificar resultado (todas as colunas)
SELECT * 
FROM public.plan_settings
ORDER BY price;

-- ================================================
-- OPÇÃO 2: Se quiser ver apenas colunas específicas
-- ================================================

-- Primeiro, veja quais colunas existem:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plan_settings'
ORDER BY ordinal_position;

-- Depois ajuste o SELECT conforme as colunas que existem
-- Exemplo (ajuste conforme o resultado acima):
-- SELECT id, name, price, max_images_per_month 
-- FROM public.plan_settings
-- ORDER BY price;

-- ================================================
-- VERIFICAÇÃO FINAL
-- ================================================

-- Ver todos os planos com preços:
SELECT * FROM public.plan_settings ORDER BY id;

-- Resultado esperado:
-- id    | price  | max_images_per_month
-- ------|--------|---------------------
-- free  | 0.00   | 3
-- starter| 29.99 | 20
-- pro   | 49.99  | 50
