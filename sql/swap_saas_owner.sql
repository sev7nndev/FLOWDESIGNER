-- 1. Demote any existing owners to 'pro' (Safe Demotion)
UPDATE profiles 
SET role = 'pro' 
WHERE role = 'owner' AND email != 'lucasformaggio@gmail.com';

-- 2. Promote the target user to 'owner'
UPDATE profiles 
SET role = 'owner', updated_at = NOW()
WHERE email = 'lucasformaggio@gmail.com';

-- 3. Verify
SELECT email, role FROM profiles WHERE role = 'owner';
