-- Delete current user and recreate with password via Supabase Dashboard

-- 1. Delete existing user
DELETE FROM public.members WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'cristianluke@gmail.com'
);

DELETE FROM public.users WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'cristianluke@gmail.com'
);

DELETE FROM auth.users WHERE email = 'cristianluke@gmail.com';

-- 2. After deleting, go to Supabase Dashboard:
--    Authentication → Users → "Add User" → Email & Password
--    Email: cristianluke@gmail.com
--    Password: 123456
--    Auto-confirm: YES

-- 3. Then run SEED_super_admin.sql again to complete setup
