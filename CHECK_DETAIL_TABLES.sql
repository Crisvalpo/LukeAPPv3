SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('spools', 'welds', 'mto', 'bolted_joints');
