-- Tabela para configurações globais do app (como token do MP)
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can write (effectively no public write)
-- Policy: Only admins can read? Or just service role?
-- Ideally only service role should access this table.

-- Grant access
GRANT ALL ON public.app_config TO postgres;
GRANT ALL ON public.app_config TO service_role;
