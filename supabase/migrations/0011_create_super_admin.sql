-- ============================================
-- CREATE SUPER ADMIN USER
-- Email: cristianluke@gmail.com
-- Password: 123456
-- ============================================

-- Step 1: Create auth user (if not exists)
-- Note: You must do this via Supabase Auth UI or this SQL won't work
-- Go to: Authentication > Users > Invite user
-- Email: cristianluke@gmail.com

-- Step 2: Get the user ID (run this AFTER creating in Auth UI)
-- Copy the user ID from the result

SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'cristianluke@gmail.com';

-- Step 3: Create user in public.users (replace USER_ID)
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
VALUES (
    'USER_ID_HERE',  -- ← Replace with ID from step 2
    'cristianluke@gmail.com',
    'Cristian Luke',
    NOW(),
    NOW()
);

-- Step 4: Create member with super_admin role
INSERT INTO public.members (user_id, company_id, project_id, role_id, created_at)
VALUES (
    'USER_ID_HERE',  -- ← Same ID
    NULL,
    NULL,
    'super_admin',
    NOW()
);

-- Verify
SELECT 
    u.email,
    u.full_name,
    m.role_id,
    m.created_at
FROM public.members m
JOIN public.users u ON u.id = m.user_id
WHERE m.role_id = 'super_admin';
