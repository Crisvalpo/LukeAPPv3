SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN ('users', 'members'))
   OR (schemaname = 'auth' AND tablename = 'users')
ORDER BY schemaname, tablename;
