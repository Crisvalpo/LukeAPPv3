-- COMPREHENSIVE COUNTER DIAGNOSIS
-- Run this to find out why counts are showing 0

-- 1. Check if columns exist in engineering_revisions
SELECT 
  'Columns check' as step,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'engineering_revisions' 
  AND column_name IN ('welds_count', 'spools_count')
ORDER BY column_name;

-- 2. Show actual data in engineering_revisions (including counts)
SELECT 
  'engineering_revisions table' as step,
  id,
  rev_code,
  revision_status,
  welds_count,
  spools_count,
  created_at
FROM engineering_revisions
WHERE revision_status = 'SPOOLEADO'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Count actual welds per revision
SELECT 
  'Actual welds count' as step,
  er.id,
  er.rev_code,
  COUNT(sw.id) as actual_welds,
  COUNT(DISTINCT sw.spool_number) as actual_spools
FROM engineering_revisions er
LEFT JOIN spools_welds sw ON sw.revision_id = er.id
WHERE er.revision_status = 'SPOOLEADO'
GROUP BY er.id, er.rev_code
ORDER BY er.created_at DESC
LIMIT 5;

-- 4. If columns exist but are 0, THIS IS THE FIX:
UPDATE engineering_revisions er
SET 
  welds_count = (
    SELECT COUNT(*)
    FROM spools_welds sw
    WHERE sw.revision_id = er.id
  ),
  spools_count = (
    SELECT COUNT(DISTINCT spool_number)
    FROM spools_welds sw
    WHERE sw.revision_id = er.id
  )
WHERE EXISTS (
  SELECT 1 FROM spools_welds sw WHERE sw.revision_id = er.id
);

-- 5. Verify the fix worked
SELECT 
  'After update verification' as step,
  rev_code,
  revision_status,
  welds_count,
  spools_count
FROM engineering_revisions
WHERE revision_status = 'SPOOLEADO'
ORDER BY updated_at DESC
LIMIT 5;
