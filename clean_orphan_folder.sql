-- Manual Cleanup for Orphaned Storage Folder
-- Target: 'pdp-991b9aed' inside 'project-files' bucket

-- 1. Count objects to be deleted (Dry Run Check)
SELECT count(*) as files_to_delete
FROM storage.objects
WHERE bucket_id = 'project-files'
AND name LIKE 'pdp-991b9aed%';

-- 2. Delete the objects
DELETE FROM storage.objects
WHERE bucket_id = 'project-files'
AND name LIKE 'pdp-991b9aed%';

-- 3. Confirm deletion
SELECT count(*) as remaining_files
FROM storage.objects
WHERE bucket_id = 'project-files'
AND name LIKE 'pdp-991b9aed%';
