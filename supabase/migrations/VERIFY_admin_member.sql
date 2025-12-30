SELECT 
    u.email,
    m.role_id,
    m.company_id,
    c.name as company_name,
    m.project_id
FROM public.users u
LEFT JOIN public.members m ON m.user_id = u.id
LEFT JOIN public.companies c ON c.id = m.company_id
WHERE u.email = 'admin@lukeapp.test';
