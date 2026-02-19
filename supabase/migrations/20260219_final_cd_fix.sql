-- Final Fix for Document Control (Local & Cloud Sync)
-- Target: Fix Storage RLS, Missing Specialties Column, and Area Table Name

-- 1. Rename 'areas' to 'project_areas' if it exists with the old name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'areas' AND table_schema = 'public') THEN
        ALTER TABLE public.areas RENAME TO project_areas;
    END IF;
END $$;

-- 2. Enhance specialties table for Multi-tenancy
ALTER TABLE public.specialties ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.specialties ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2b. Add is_active to document_types and project_areas
ALTER TABLE public.document_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.project_areas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing specialties to a valid company (HQ if exists, or first company)
DO $$ 
DECLARE
    v_target_company_id UUID;
BEGIN
    -- Try to find LukeAPP HQ by slug first (standard seed)
    SELECT id INTO v_target_company_id FROM public.companies WHERE slug = 'lukeapp-hq' LIMIT 1;
    
    -- Fallback to 'Eimisa' (another common seed) if HQ not found
    IF v_target_company_id IS NULL THEN
        SELECT id INTO v_target_company_id FROM public.companies WHERE slug = 'eimisa' LIMIT 1;
    END IF;

    -- Final fallback: oldest company in the system
    IF v_target_company_id IS NULL THEN
        SELECT id INTO v_target_company_id FROM public.companies ORDER BY created_at LIMIT 1;
    END IF;

    -- Update only if we found something
    IF v_target_company_id IS NOT NULL THEN
        UPDATE public.specialties SET company_id = v_target_company_id WHERE company_id IS NULL;
    END IF;
END $$;

-- 3. Fix Storage RLS Policies for 'project-files' bucket
-- This bucket uses paths like: {slug}-{full-uuid}/{project-slug}-{project-uuid}/...

DROP POLICY IF EXISTS "Users can read from own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from own company projects" ON storage.objects;

-- SELECT Policy
CREATE POLICY "Users can read from own company projects" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'project-files' AND (
    EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid() AND m.role_id = 'super_admin') OR
    (storage.foldername(name))[1] IN (
      SELECT c.slug || '-' || c.id::text FROM public.companies c JOIN public.members m ON m.company_id = c.id WHERE m.user_id = auth.uid()
      UNION
      SELECT c.slug || '-' || split_part(c.id::text, '-', 1) FROM public.companies c JOIN public.members m ON m.company_id = c.id WHERE m.user_id = auth.uid()
    )
  )
);

-- INSERT Policy
CREATE POLICY "Users can upload to own company projects" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND (
    EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = auth.uid() AND m.role_id = 'super_admin') OR
    (storage.foldername(name))[1] IN (
      SELECT c.slug || '-' || c.id::text FROM public.companies c JOIN public.members m ON m.company_id = c.id WHERE m.user_id = auth.uid()
      UNION
      SELECT c.slug || '-' || split_part(c.id::text, '-', 1) FROM public.companies c JOIN public.members m ON m.company_id = c.id WHERE m.user_id = auth.uid()
    )
  )
);

-- 4. Consolidate transmittals table schema and constraints
-- Fix status check to include all states used in the application
ALTER TABLE public.transmittals DROP CONSTRAINT IF EXISTS transmittals_status_check;
ALTER TABLE public.transmittals ADD CONSTRAINT transmittals_status_check 
    CHECK (status IN ('DRAFT', 'SENT', 'RECEIVED', 'ACKNOWLEDGED', 'PENDING_PROCESS', 'PROCESSED'));

-- Ensure all columns from recent extensions exist
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'INCOMING';
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS package_url TEXT;
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS manifest_url TEXT;

-- 5. Grant Permissions to authenticated role on configuration and transactional tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_areas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_master TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transmittals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transmittal_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_event_log TO authenticated;
