-- Create a singleton table for SaaS settings
CREATE TABLE IF NOT EXISTS public.saas_settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  owner_mp_access_token TEXT,
  owner_mp_refresh_token TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists (Singleton Pattern)
CREATE UNIQUE INDEX IF NOT EXISTS only_one_row ON public.saas_settings ((id > 0));

-- Insert default row if not exists
INSERT INTO public.saas_settings (owner_mp_access_token)
SELECT NULL
WHERE NOT EXISTS (SELECT 1 FROM public.saas_settings);

-- RLS: Only Owner can view/update
ALTER TABLE public.saas_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage settings" ON public.saas_settings;

CREATE POLICY "Owner can manage settings"
ON public.saas_settings
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
  )
);
