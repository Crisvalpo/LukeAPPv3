-- Quick verification of super admin setup

-- Check auth.users
SELECT 'AUTH' as source, id, email, email_confirmed_at IS NOT NULL as confirmed
FROM auth.users
WHERE email = 'admin@lukeapp.test';

-- Check public.users
SELECT 'PUBLIC' as source, id, email, full_name
FROM public.users
WHERE email = 'admin@lukeapp.test';

-- Check members
SELECT 'MEMBERS' as source, user_id, role_id, status, company_id
FROM public.members m
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@lukeapp.test');

-- Full join verification
SELECT 
  'FULL SETUP' as status,
  au.email,
  pu.full_name,
  m.role_id,
  m.status,
  CASE WHEN m.company_id IS NULL THEN 'NO COMPANY (correct for super_admin)' ELSE m.company_id::text END as company_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
LEFT JOIN public.members m ON m.user_id = au.id
WHERE au.email = 'admin@lukeapp.test';
