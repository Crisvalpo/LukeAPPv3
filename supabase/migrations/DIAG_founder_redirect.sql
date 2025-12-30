-- Diagnostic: Check why founder is redirecting to lobby
-- This will show the founder's membership data

-- 1. Check if user exists in auth
SELECT 
  'AUTH USER' as check_type,
  id,
  email,
  created_at
FROM auth.users
WHERE email ILIKE '%fundador%' OR email ILIKE '%founder%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check membership data for founder users
SELECT 
  'MEMBER DATA' as check_type,
  m.user_id,
  u.email,
  m.role_id,
  m.functional_role_id,
  m.status,
  m.company_id,
  cr.name as functional_role_name
FROM members m
JOIN auth.users u ON u.id = m.user_id
LEFT JOIN company_roles cr ON cr.id = m.functional_role_id
WHERE u.email ILIKE '%fundador%' OR u.email ILIKE '%founder%'
ORDER BY m.created_at DESC;

-- 3. Check companies created by founder
SELECT 
  'COMPANIES' as check_type,
  c.id,
  c.name,
  c.slug,
  u.email as owner_email
FROM companies c
JOIN auth.users u ON u.id = c.owner_id
ORDER BY c.created_at DESC
LIMIT 5;

-- 4. Full diagnostic for a specific email (REPLACE WITH YOUR EMAIL)
-- Uncomment and replace 'your-email@example.com' with actual founder email
/*
WITH founder_user AS (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
)
SELECT 
  'Full Diagnostic' as info,
  u.email,
  m.role_id,
  m.functional_role_id,
  m.status,
  c.name as company_name,
  cr.name as functional_role_name,
  cr.permissions
FROM founder_user fu
JOIN auth.users u ON u.id = fu.id
LEFT JOIN members m ON m.user_id = fu.id AND m.status = 'ACTIVE'
LEFT JOIN companies c ON c.id = m.company_id
LEFT JOIN company_roles cr ON cr.id = m.functional_role_id;
*/
