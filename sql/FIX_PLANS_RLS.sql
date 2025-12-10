
-- Resetar RLS para plan_settings
ALTER TABLE public.plan_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

-- 1. Leitura IRRESTRITA (Pública)
DROP POLICY IF EXISTS "Public read plans" ON public.plan_settings;
CREATE POLICY "Public read plans" ON public.plan_settings FOR SELECT USING (true);

-- 2. Edição apenas para Owners (Via checagem de role na tabela profiles)
DROP POLICY IF EXISTS "Owner update plans" ON public.plan_settings;
CREATE POLICY "Owner update plans" ON public.plan_settings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
  )
);

-- Permissão explícita
GRANT ALL ON public.plan_settings TO authenticated;
GRANT SELECT ON public.plan_settings TO anon;
