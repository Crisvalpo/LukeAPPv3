-- Check if specific metadata columns exist
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'engineering_revisions'
  AND column_name IN ('transmittal', 'announcement_date', 'revision_status');
