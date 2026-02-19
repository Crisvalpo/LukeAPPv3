SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('users', 'members');
SELECT schemaname, tablename, count(*) as policy_count FROM pg_policies WHERE tablename IN ('users', 'members') GROUP BY schemaname, tablename;
