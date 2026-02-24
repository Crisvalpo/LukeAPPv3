-- FIX: Allow Company Logo Uploads (RLS Policy)
-- Problem: Current storage RLS assumes project-context paths. Company logos are stored at root: /{company_slug}/company/...
-- Solution: Add policies to allow Members to manage files in their company's 'company' folder.

BEGIN;

-- 1. Policy for INSERT (Upload Logo)
-- Allow any member of the company to upload files to their /{slug}/company/ folder
DROP POLICY IF EXISTS "Members can upload company assets" ON storage.objects;
CREATE POLICY "Members can upload company assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT slug FROM public.companies c
        JOIN public.members m ON m.company_id = c.id
        WHERE m.user_id = auth.uid()
    ) AND
    (storage.foldername(name))[2] = 'company' -- Enforce 'company' subfolder
);

-- 2. Policy for UPDATE (Replace Logo)
DROP POLICY IF EXISTS "Members can update company assets" ON storage.objects;
CREATE POLICY "Members can update company assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT slug FROM public.companies c
        JOIN public.members m ON m.company_id = c.id
        WHERE m.user_id = auth.uid()
    ) AND
    (storage.foldername(name))[2] = 'company'
);

-- 3. Policy for DELETE (Remove Logo)
DROP POLICY IF EXISTS "Members can delete company assets" ON storage.objects;
CREATE POLICY "Members can delete company assets" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT slug FROM public.companies c
        JOIN public.members m ON m.company_id = c.id
        WHERE m.user_id = auth.uid()
    ) AND
    (storage.foldername(name))[2] = 'company'
);

-- 4. Policy for SELECT (View Logo) - Usually covered by public read, but ensuring authenticated access too
DROP POLICY IF EXISTS "Members can view company assets" ON storage.objects;
CREATE POLICY "Members can view company assets" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT slug FROM public.companies c
        JOIN public.members m ON m.company_id = c.id
        WHERE m.user_id = auth.uid()
    )
);

COMMIT;
