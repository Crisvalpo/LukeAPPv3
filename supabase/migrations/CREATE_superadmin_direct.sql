-- Clean superadmin test - use different email
-- Email: admin@lukeapp.test
-- Password: 123456

-- 1. Clean any existing data
DELETE FROM public.members WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('cristianluke@gmail.com', 'admin@lukeapp.test')
);

DELETE FROM public.users WHERE email IN ('cristianluke@gmail.com', 'admin@lukeapp.test');

DELETE FROM auth.users WHERE email IN ('cristianluke@gmail.com', 'admin@lukeapp.test');

-- 2. Create fresh user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@lukeapp.test',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  '',
  '',
  '',
  ''
) RETURNING id;

-- 3. Complete setup
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@lukeapp.test';
  
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (admin_id, 'admin@lukeapp.test', 'Luke Admin', NOW(), NOW());
  
  INSERT INTO public.members (user_id, role_id, status, created_at, updated_at)
  VALUES (admin_id, 'super_admin', 'ACTIVE', NOW(), NOW());
  
  RAISE NOTICE 'Created superadmin: %', admin_id;
END $$;

-- Verify
SELECT au.email, m.role_id, m.status
FROM auth.users au
JOIN public.members m ON m.user_id = au.id
WHERE au.email = 'admin@lukeapp.test';
