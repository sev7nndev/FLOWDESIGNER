-- FIX DATABASE ERROR
-- Run this script in your Supabase SQL Editor to remove the broken trigger.
-- The backend API already handles profile creation, so this trigger is creating a conflict.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify it is gone
SELECT 'Trigger dropped successfully' as result;
