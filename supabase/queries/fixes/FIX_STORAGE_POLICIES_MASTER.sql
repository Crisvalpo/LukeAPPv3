-- MASTER FIX: STORAGE RLS POLICIES (Project Files)
-- Objective: Simplify and robustify access control for the 'project-files' bucket.
-- Strategy:
-- 1. Wipe existing conflicting policies.
-- 2. Create one Unified Policy: "If you are a member of Company X, you can R/W anything starting with 'X/'".
-- 3. Ensure public read access for convenience (or restricted if preferred, but let's stick to simple first).

BEGIN;

-- ==================================================================
-- 1. CLEANUP (Drop old/fragmented policies)
-- ==================================================================
DROP POLICY IF EXISTS "Members can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Members can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Members can view company assets" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete company assets" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their company files" ON storage.objects;
-- Drop any generic ones that might interfere
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access 1" ON storage.objects;

-- ==================================================================
-- 2. DEFINE POLICIES
-- ==================================================================

-- A. PUBLIC READ (Optional: Change to authenticated if strict privacy needed)
-- Allows reading any file if you have the URL. Useful for debugging and logos.
CREATE POLICY "Global Public Read" ON storage.objects
FOR SELECT USING ( bucket_id = 'project-files' );

-- B. MEMBER WRITE ACCESS (Unified)
-- Logic: A user can INSERT/UPDATE/DELETE if the file path starts with the SLUG of a company they belong to.
-- Path format: "{company_slug}/..."
-- storage.foldername(name)[1] returns the first segment (company_slug).

CREATE POLICY "Members can manage company files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT c.slug 
        FROM public.companies c
        JOIN public.members m ON m.company_id = c.id
        WHERE m.user_id = auth.uid()
    )
);

CREATE POLICY "Members can update company files" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT c.slug 
        FROM public.companies c
        JOIN public.members m ON m.company_id = c.id
        WHERE m.user_id = auth.uid()
    )
);

CREATE POLICY "Members can delete company files" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
        SELECT c.slug 
        FROM public.companies c
        JOIN public.members m ON m.company_id = c.id
        WHERE m.user_id = auth.uid()
    )
);

-- ==================================================================
-- 3. ENSURE BUCKET EXISTS AND IS PUBLIC
-- ==================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

COMMIT;

-- Verification query (run manually if needed)
-- SELECT * FROM storage.policies WHERE bucket_id = 'project-files';
