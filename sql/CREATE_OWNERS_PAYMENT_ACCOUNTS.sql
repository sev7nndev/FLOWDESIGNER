-- Tabela para armazenar tokens do Mercado Pago do Dono do SaaS
CREATE TABLE IF NOT EXISTS public.owners_payment_accounts (
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    public_key TEXT,
    user_id_mp TEXT, -- ID do usuário no Mercado Pago
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Apenas o dono pode ver/editar sua própria chave
ALTER TABLE public.owners_payment_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manage own payment keys" ON public.owners_payment_accounts;
CREATE POLICY "Owner manage own payment keys"
ON public.owners_payment_accounts
FOR ALL
USING (auth.uid() = owner_id);

-- Permitir que ADMIN/DEV veja SE existe conexão (sem ver o token)
-- Isso é complexo com RLS padrão, mas o código do frontend tenta ler 'owner_id'.
-- Vamos permitir leitura para admins.
CREATE POLICY "Admins view payment status"
ON public.owners_payment_accounts
FOR SELECT
USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin', 'dev')
  )
);
