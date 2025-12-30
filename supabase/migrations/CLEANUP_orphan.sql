-- CLEANUP ORPHAN IDENTITY
-- We found an identity in auth.identities without a matching user in auth.users (seemingly).
-- Let's delete it by ID to be precise.

DELETE FROM auth.identities 
WHERE id = 'de462b5e-e618-4c2a-a76b-55e600509c23' 
OR email = 'cristianluke@gmail.com';

-- Double check
SELECT 'auth.identities' as table_name, user_id as id, email FROM auth.identities WHERE email = 'cristianluke@gmail.com';
