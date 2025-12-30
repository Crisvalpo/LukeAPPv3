-- Simulation: Create user cristianluke@gmail.com to test trigger
-- This mimics what Supabase Auth does

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- 1. Insert into auth.users (Trigger should fire)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'cristianluke@gmail.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name": "Cristian Luke"}'
  );
  
  -- 2. Verify public.users was populated by trigger
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new_user_id) THEN
    RAISE EXCEPTION 'Trigger failed to create public.users entry!';
  END IF;

  RAISE NOTICE 'User creation simulated successfully: %', new_user_id;
  
  -- Cleanup (Rollback naturally via exception if failed, or manual delete)
  -- We want to clean up so the user can verify in UI
  -- DELETE FROM auth.users WHERE id = new_user_id;
END $$;
