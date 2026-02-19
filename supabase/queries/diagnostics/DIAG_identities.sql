-- Compare Identities
SELECT user_id, provider_id, identity_data, provider, created_at, updated_at 
FROM auth.identities 
WHERE email = 'cristianluke+v3@gmail.com';
