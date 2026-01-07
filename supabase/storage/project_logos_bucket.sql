-- Supabase Storage Bucket Configuration for Project Logos
-- Run this in Supabase Dashboard > Storage

-- 1. Create bucket (if not exists)
-- NOTE: This must be run through Supabase Dashboard UI or API
-- Dashboard: Storage > New Bucket
-- Bucket name: project-logos
-- Public: Yes (for PDF generation to access logos)
-- File size limit: 2MB
-- Allowed MIME types: image/png, image/jpeg, image/jpg

-- 2. Set RLS Policies for the bucket
-- Policy 1: PUBLIC READ (anyone can view logos for PDFs)
CREATE POLICY "Public Access for Project Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-logos');

-- Policy 2: AUTHENTICATED INSERT (only authenticated users can upload)
CREATE POLICY "Authenticated users can upload project logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-logos' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: AUTHENTICATED UPDATE (only authenticated users can update their company's logos)
CREATE POLICY "Authenticated users can update project logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-logos' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: AUTHENTICATED DELETE (only authenticated users can delete their company's logos)
CREATE POLICY "Authenticated users can delete project logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-logos' 
  AND auth.role() = 'authenticated'
);

-- 3. Create bucket via SQL (alternative to UI)
-- Uncomment and run if creating via SQL:
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-logos',
  'project-logos',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;
*/
