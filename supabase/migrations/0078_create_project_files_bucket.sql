-- Create 'project-files' bucket and policies
-- This bucket consolidates all project files (logos, models, docs) in one place

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'project-files', 
    'project-files', 
    false, -- Private bucket (files served via signed URLs or RLS)
    false,
    52428800, -- 50MB limit (can be adjusted)
    NULL -- All mime types allowed for now
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS policies

-- Allow authenticated users to upload to their company's projects
-- Path structure: {company_id}/{project_id}/...
CREATE POLICY "Users can upload to own company projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.members 
        WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to read from their company's projects  
CREATE POLICY "Users can read from own company projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.members 
        WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to delete from their company's projects
CREATE POLICY "Users can delete from own company projects"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.members 
        WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to update (replace) files
CREATE POLICY "Users can update own company projects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.members 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM public.members 
        WHERE user_id = auth.uid()
    )
);
