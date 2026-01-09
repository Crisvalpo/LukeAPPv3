-- Fix storage policies for isometric-models to allow full CRUD
-- We drop the generic named policies from 0066 to replace them with more specific ones to avoid conflicts/confusion

BEGIN;

-- Drop old policies (if they exist)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- 1. INSERT Policy
CREATE POLICY "isometric_models_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'isometric-models' );

-- 2. UPDATE Policy (Overwrite files)
CREATE POLICY "isometric_models_update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'isometric-models' )
WITH CHECK ( bucket_id = 'isometric-models' );

-- 3. DELETE Policy (Delete files)
CREATE POLICY "isometric_models_delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'isometric-models' );

-- 4. SELECT Policy (Public Read)
CREATE POLICY "isometric_models_select"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'isometric-models' );

COMMIT;
