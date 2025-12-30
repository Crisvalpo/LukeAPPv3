-- FORCE PASSWORD UPDATE
-- Reset password to 'LukeAPP_2025!' using a standard bcrypt cost 10
-- Hash: $2a$10$w... (Pre-calculated or using gen_salt('bf', 10) if available)

-- Note: pgcrypto gen_salt('bf') defaults to 6. Supabase might require higher.
-- Let's try explicit cost 10.

UPDATE auth.users
SET encrypted_password = crypt('LukeAPP_2025!', gen_salt('bf', 10)),
    updated_at = now()
WHERE email = 'luke@lukeapp.com';
