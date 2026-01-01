-- DIAGNOSTIC QUERY: Check if welds have revision_id
-- Run this in Supabase SQL Editor to diagnose the count issue

-- 1. Check if welds_count and spools_count columns exist in engineering_revisions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'engineering_revisions' 
  AND column_name IN ('welds_count', 'spools_count')
ORDER BY column_name;

-- 2. Count total welds in database
SELECT COUNT(*) as total_welds_in_db
FROM spools_welds;

-- 3. Count welds WITH revision_id
SELECT COUNT(*) as welds_with_revision
FROM spools_welds
WHERE revision_id IS NOT NULL;

-- 4. Count welds WITHOUT revision_id (PROBLEM if > 0)
SELECT COUNT(*) as welds_without_revision
FROM spools_welds
WHERE revision_id IS NULL;

-- 5. Show revision counts (should NOT be 0 if welds exist)
SELECT 
  er.id,
  er.rev_code,
  er.revision_status,
  er.welds_count,
  er.spools_count,
  (SELECT COUNT(*) FROM spools_welds sw WHERE sw.revision_id = er.id) as actual_welds_count,
  (SELECT COUNT(DISTINCT spool_number) FROM spools_welds sw WHERE sw.revision_id = er.id) as actual_spools_count
FROM engineering_revisions er
WHERE er.revision_status = 'SPOOLEADO'
ORDER BY er.updated_at DESC
LIMIT 5;
