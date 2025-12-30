-- VERIFY GENESIS USER
-- Checks if the reboot resulted in a valid initial state

SELECT 
    'Auth User' as check_type,
    id, 
    email, 
    role, 
    email_confirmed_at, 
    encrypted_password IS NOT NULL as has_password
FROM auth.users 
WHERE email = 'luke@lukeapp.com';

SELECT 
    'Public User' as check_type,
    id, 
    email, 
    full_name
FROM public.users 
WHERE email = 'luke@lukeapp.com';

SELECT 
    'Company' as check_type,
    c.name, 
    c.slug
FROM public.companies c 
WHERE c.slug = 'lukeapp-hq';

SELECT 
    'Membership' as check_type,
    m.role_id,
    c.name as company_name
FROM public.members m
JOIN public.users u ON u.id = m.user_id
JOIN public.companies c ON c.id = m.company_id
WHERE u.email = 'luke@lukeapp.com';
