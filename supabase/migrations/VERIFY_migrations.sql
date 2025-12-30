-- Post-Migration Verification Query
-- Execute this to confirm all tables and columns were created

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engineering_revisions') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as engineering_revisions,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_mto') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as spools_mto,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spools_joints') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as spools_joints,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'engineering_revisions' AND column_name = 'data_status'
    ) 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as data_status_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'engineering_revisions' AND column_name = 'material_status'
    ) 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as material_status_column;
