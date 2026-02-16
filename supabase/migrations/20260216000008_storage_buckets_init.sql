-- Migration 20260216000008: Storage Buckets Initialization
-- Ensures project-files and project-logos exist with proper policies

-- 1. Create project-files bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files', 
    'project-files', 
    true, -- Set to true for easier access to public engineering documents, RLS still applies
    104857600, -- 100MB
    NULL
)
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public, 
    file_size_limit = EXCLUDED.file_size_limit;

-- 2. Create project-logos bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-logos', 
    'project-logos', 
    true,
    5242880, -- 5MB
    '{image/png,image/jpeg,image/webp,image/svg+xml}'
)
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public, 
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Reset Policies for project-files for better descriptive path support
-- Descriptive path pattern: {company-slug}-{company-id}/{project-code}-{project-id}/...

DROP POLICY IF EXISTS "Users can upload to own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company projects" ON storage.objects;

-- RLS: Select (Read)
CREATE POLICY "Users can read from own company projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'project-files' AND
    (
        -- Super Admin bypass or matching company_id in path
        EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid() AND m.role_id = 'super_admin') OR
        (storage.foldername(name))[1] IN (
            SELECT (c.slug || '-' || split_part(c.id::text, '-', 1))
            FROM public.companies c
            INNER JOIN public.members m ON m.company_id = c.id
            WHERE m.user_id = auth.uid()
        )
    )
);

-- RLS: Insert (Upload)
CREATE POLICY "Users can upload to own company projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'project-files' AND
    (
        EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid() AND m.role_id = 'super_admin') OR
        (storage.foldername(name))[1] IN (
            SELECT (c.slug || '-' || split_part(c.id::text, '-', 1))
            FROM public.companies c
            INNER JOIN public.members m ON m.company_id = c.id
            WHERE m.user_id = auth.uid()
        )
    )
);

-- RLS: Update
CREATE POLICY "Users can update own company projects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'project-files' AND
    (
        EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid() AND m.role_id = 'super_admin') OR
        (storage.foldername(name))[1] IN (
            SELECT (c.slug || '-' || split_part(c.id::text, '-', 1))
            FROM public.companies c
            INNER JOIN public.members m ON m.company_id = c.id
            WHERE m.user_id = auth.uid()
        )
    )
);

-- RLS: Delete
CREATE POLICY "Users can delete from own company projects"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'project-files' AND
    (
        EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid() AND m.role_id = 'super_admin') OR
        (storage.foldername(name))[1] IN (
            SELECT (c.slug || '-' || split_part(c.id::text, '-', 1))
            FROM public.companies c
            INNER JOIN public.members m ON m.company_id = c.id
            WHERE m.user_id = auth.uid()
        )
    )
);
