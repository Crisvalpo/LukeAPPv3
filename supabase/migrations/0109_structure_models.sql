-- Create Structure Models Table
CREATE TABLE IF NOT EXISTS public.structure_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area TEXT,
    model_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Table
ALTER TABLE public.structure_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Table structure_models
CREATE POLICY "Enable read access for authenticated users"
ON public.structure_models FOR SELECT
TO authenticated
USING (true); -- Filter by project_id is handled in application logic usually, but better to be safe? 
-- LukeApp pattern seems to be often open select for auth or specific by company. 
-- Let's stick to simple auth read for now, filtering by project is standard.

CREATE POLICY "Enable all access for authenticated users"
ON public.structure_models FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('structure-models', 'structure-models', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage Bucket
-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads structure-models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'structure-models' );

-- Allow authenticated updates
CREATE POLICY "Allow authenticated updates structure-models"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'structure-models' );

-- Allow authenticated deletes
CREATE POLICY "Allow authenticated deletes structure-models"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'structure-models' );

-- Allow public read access (since it's a public bucket, but good to be explicit for SELECT)
CREATE POLICY "Allow public read access structure-models"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'structure-models' );
