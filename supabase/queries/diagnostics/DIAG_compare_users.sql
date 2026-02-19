-- Compare Users and Identities (Full Dump)
SELECT to_jsonb(u.*) as user_record 
FROM auth.users u 
WHERE email = 'cristianluke+v3@gmail.com';

SELECT to_jsonb(u.*) as user_record 
FROM auth.users u 
WHERE email LIKE 'test_login_%' 
ORDER BY created_at DESC LIMIT 1;

SELECT to_jsonb(i.*) as identity_record
FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id
WHERE u.email = 'cristianluke+v3@gmail.com';

SELECT to_jsonb(i.*) as identity_record
FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id
WHERE u.email LIKE 'test_login_%'
ORDER BY i.created_at DESC LIMIT 1;
