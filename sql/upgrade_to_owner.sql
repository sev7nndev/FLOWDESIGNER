-- Upgrade the user to 'owner' role to bypass generation limits
UPDATE public.profiles
SET role = 'owner', updated_at = NOW()
WHERE email = 'sevenbeatx@gmail.com'; -- Replace with actual email if different, assuming this is the owner based on context

-- Also reset usage just in case
UPDATE public.user_usage
SET images_generated = 0
WHERE user_id IN (SELECT id FROM profiles WHERE role = 'owner');
