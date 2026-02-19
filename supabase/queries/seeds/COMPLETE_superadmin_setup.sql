-- Complete super admin setup with known UUID
-- User ID: 72ad4511-ec57-4334-af8c-657963a1f07b
-- Email: admin@lukeapp.test

DO $$
DECLARE
  admin_user_id UUID := '72ad4511-ec57-4334-af8c-657963a1f07b';
BEGIN
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

-- Final verification
SELECT 
  au.email,
  pu.full_name,
  m.role_id,
  m.status,
  CASE WHEN m.company_id IS NULL THEN '✅ No company (correct)' ELSE m.company_id::text END as company_status
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
LEFT JOIN public.members m ON m.user_id = au.id
WHERE au.id = '72ad4511-ec57-4334-af8c-657963a1f07b';
