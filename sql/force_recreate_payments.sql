-- FORCE RECREATE PAYMENTS TABLE
-- WARNING: This deletes existing payment history (Test Data).

DROP TABLE IF EXISTS public.payments CASCADE;

CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL, -- 'approved', 'pending', 'rejected'
  mercadopago_payment_id TEXT,
  plan TEXT, -- 'starter', 'pro'
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Permissions
GRANT ALL ON public.payments TO service_role;
GRANT SELECT ON public.payments TO authenticated; 

-- Policies
CREATE POLICY "Users can view own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" 
ON public.payments FOR SELECT 
USING (
  exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('owner', 'admin', 'dev')
  )
);

-- Force Cache Reload
NOTIFY pgrst, 'reload schema';
