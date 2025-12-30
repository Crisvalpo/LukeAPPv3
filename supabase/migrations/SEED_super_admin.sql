-- Check current state and complete super admin setup

-- 1. Check what exists in auth.users
SELECT 
  'AUTH USER' as type,
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'admin@lukeapp.test';

-- 2. Check if exists in public.users
SELECT 
  'PUBLIC USER' as type,
  id,
  email,
  full_name
FROM public.users
WHERE email = 'admin@lukeapp.test';

-- 3. Check if exists in members
SELECT 
  'MEMBER' as type,
  user_id,
  role_id,
  status,
  company_id
FROM public.members m
JOIN auth.users au ON au.id = m.user_id
WHERE au.email = 'cristianluke@gmail.com';

-- 4. Complete the setup (run after verification)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user ID from auth
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@lukeapp.test';

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users. Please accept the invitation first.';
  END IF;

  RAISE NOTICE 'Found user: %', admin_user_id;

  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    admin_user_id,
    'admin@lukeapp.test',
    'Luke Admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);

  RAISE NOTICE 'Created/Updated public.users';

  -- Insert into members with super_admin role (no company_id)
  INSERT INTO public.members (
    user_id,
    role_id,
    status,
    created_at,
    updated_at
  )
  VALUES (
    admin_user_id,
    'super_admin',
    'ACTIVE',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created member with super_admin role';

  RAISE NOTICE '✅ Super admin setup completed!';
END $$;

-- 5. Final verification
SELECT 
  au.email,
  pu.full_name,
  m.role_id,
  m.status,
  m.company_id
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
LEFT JOIN public.members m ON m.user_id = au.id
WHERE au.email = 'cristianluke@gmail.com';
