-- DIAGNOSTIC QUERY: Check which tables exist in your database
-- Copy and paste this into Supabase SQL Editor

-- 1. List all tables in public schema
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Specifically check for engineering-related tables
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engineering_revisions') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as engineering_revisions,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'isometrics') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as isometrics,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as spools,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_mto') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as spools_mto;

-- 3. Check if engineering_revisions has the new columns we want to add
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'engineering_revisions'
  AND column_name IN ('data_status', 'material_status')
ORDER BY column_name;
