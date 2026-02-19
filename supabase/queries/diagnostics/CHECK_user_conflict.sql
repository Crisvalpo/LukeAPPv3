-- Check if user exists in public.users (orphaned?)
SELECT * FROM public.users WHERE email = 'cristianluke@gmail.com';

-- Check constraints on public.users
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;
