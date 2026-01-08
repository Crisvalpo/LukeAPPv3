-- Create storage bucket for isometric models
INSERT INTO storage.buckets (id, name, public)
VALUES ('isometric-models', 'isometric-models', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads to 'isometric-models'
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'isometric-models' );

-- Policy to allow public read access to 'isometric-models'
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'isometric-models' );

-- Add column to engineering_revisions
ALTER TABLE public.engineering_revisions
ADD COLUMN IF NOT EXISTS glb_model_url TEXT;
