-- FIX PAYMENTS TABLE SCHEMA
-- Run this to ensure all columns exist (even if table was created long ago)

-- 1. Add missing columns safely
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);

-- 2. Force Cache Reload
NOTIFY pgrst, 'reload schema';
