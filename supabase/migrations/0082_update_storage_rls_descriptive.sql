-- Migration 0082: Update Storage RLS for descriptive paths
-- Previous policies checked if folder name was exactly company_id (UUID)
-- New policies must checks if folder name matches {slug}-{short_id} pattern

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from own company projects" ON storage.objects;

-- Create Helper Function to get authorized root paths for a user
-- Returns array of strings like ['acme-corp-fd48f0e5', 'other-corp-8af4928e']
CREATE OR REPLACE FUNCTION public.get_my_company_storage_paths()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT array_agg(
        c.slug || '-' || split_part(c.id::text, '-', 1)
    )
    FROM public.members m
    JOIN public.companies c ON m.company_id = c.id
    WHERE m.user_id = auth.uid();
$$;

-- Grant access to the helper
GRANT EXECUTE ON FUNCTION public.get_my_company_storage_paths() TO authenticated;

-- 1. SELECT (Read)
CREATE POLICY "Users can read from own company projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'project-files' 
    AND (storage.foldername(name))[1] = ANY(public.get_my_company_storage_paths())
);

-- 2. INSERT (Upload)
CREATE POLICY "Users can upload to own company projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'project-files' 
    AND (storage.foldername(name))[1] = ANY(public.get_my_company_storage_paths())
);

-- 3. UPDATE
CREATE POLICY "Users can update own company projects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'project-files' 
    AND (storage.foldername(name))[1] = ANY(public.get_my_company_storage_paths())
)
WITH CHECK (
    bucket_id = 'project-files' 
    AND (storage.foldername(name))[1] = ANY(public.get_my_company_storage_paths())
);

-- 4. DELETE
CREATE POLICY "Users can delete from own company projects"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'project-files' 
    AND (storage.foldername(name))[1] = ANY(public.get_my_company_storage_paths())
);
