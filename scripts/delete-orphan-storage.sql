-- Temporarily disable the protection trigger
ALTER TABLE storage.objects DISABLE TRIGGER protect_delete;

-- Delete orphan objects
DELETE FROM storage.objects 
WHERE bucket_id = 'project-files' 
AND name LIKE 'empresa-de-prueba-3550ea15/%';

-- Re-enable the trigger
ALTER TABLE storage.objects ENABLE TRIGGER protect_delete;

-- Verify
SELECT COUNT(*) as remaining, name
FROM storage.objects 
WHERE bucket_id = 'project-files' 
AND name LIKE 'empresa-de-prueba-3550ea15/%'
GROUP BY name;
