-- Configure Dev and Owner Roles

-- 1. Set sevenbeatx@gmail.com as DEV
UPDATE public.profiles
SET role = 'dev'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'sevenbeatx@gmail.com'
);

-- 2. Set lucasformaggio@gmail.com as OWNER
UPDATE public.profiles
SET role = 'owner'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'lucasformaggio@gmail.com'
);

-- 3. Verify roles
SELECT 
  u.email,
  p.role,
  p.first_name,
  p.last_name
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('sevenbeatx@gmail.com', 'lucasformaggio@gmail.com');

-- Done!
SELECT 'Roles configurados com sucesso!' AS status;
