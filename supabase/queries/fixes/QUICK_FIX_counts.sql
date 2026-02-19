-- Quick check: Did the migration run?
-- Run this to verify if welds_count and spools_count columns exist

SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'engineering_revisions' 
  AND column_name IN ('welds_count', 'spools_count')
ORDER BY column_name;

-- If columns exist but values are 0, run this to manually update:
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
WHERE er.revision_status = 'SPOOLEADO';

-- Verify the update:
SELECT 
  rev_code,
  revision_status,
  welds_count,
  spools_count,
  (SELECT COUNT(*) FROM spools_welds WHERE revision_id = er.id) as actual_welds
FROM engineering_revisions er
WHERE revision_status = 'SPOOLEADO'
LIMIT 5;
