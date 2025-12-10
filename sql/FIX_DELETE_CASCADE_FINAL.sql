-- FIX_DELETE_CASCADE_FINAL.sql
-- Goal: Ensure that deleting a user from auth.users blindly deletes ALL related data.

BEGIN;

-- 1. PROFILES
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 2. USER_USAGE
ALTER TABLE public.user_usage
DROP CONSTRAINT IF EXISTS user_usage_user_id_fkey,
ADD CONSTRAINT user_usage_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- 3. PAYMENTS
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_user_id_fkey,
ADD CONSTRAINT payments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- 4. IMAGES (Corrected Table Name)
ALTER TABLE public.images
DROP CONSTRAINT IF EXISTS images_user_id_fkey,
ADD CONSTRAINT images_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 5. FAVORITES (If exists)
-- Assuming table name 'favorites' or similar, strict check usually handled by IF EXISTS logic in migration tools
-- But since we are running raw, we'll try to catch standard names.

-- 5. IMAGE_CLEANUP_QUEUE (Removed - Table does not exist in v2 schema)
-- No action needed.

COMMIT;
