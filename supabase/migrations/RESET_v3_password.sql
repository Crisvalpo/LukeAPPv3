UPDATE auth.users 
SET encrypted_password = crypt('Password123!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cristianluke+v3@gmail.com';

DO $$
BEGIN
    RAISE NOTICE 'Password reset for +v3 user.';
END $$;
