-- CLEANUP and DIAGNOSTIC for cristianluke@gmail.com

-- 1. Check if user exists (should exist from my debug script)
SELECT 'User Status Before' as check, id, email FROM auth.users WHERE email = 'cristianluke@gmail.com';

-- 2. Check identities
SELECT 'Identities Before' as check, id, user_id, provider, identity_data 
FROM auth.identities 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'cristianluke@gmail.com');

-- 3. NUCLEAR DELETE
DELETE FROM public.members WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'cristianluke@gmail.com');
DELETE FROM public.users WHERE id IN (SELECT id FROM auth.users WHERE email = 'cristianluke@gmail.com');
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'cristianluke@gmail.com');
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'cristianluke@gmail.com');
DELETE FROM auth.users WHERE email = 'cristianluke@gmail.com';

-- 4. Verify clean
SELECT 'User Status After' as check, id, email FROM auth.users WHERE email = 'cristianluke@gmail.com';
