-- DEEP CHECK FOR EMAIL CONFLICTS
SELECT 'auth.users' as table_name, id, email, deleted_at FROM auth.users WHERE email = 'cristianluke@gmail.com'
UNION ALL
SELECT 'auth.identities' as table_name, user_id as id, email, NULL as deleted_at FROM auth.identities WHERE email = 'cristianluke@gmail.com';
