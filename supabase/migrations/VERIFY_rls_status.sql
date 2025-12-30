SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname IN ('public', 'auth');
