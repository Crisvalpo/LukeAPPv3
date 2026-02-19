-- ==========================================
-- FINAL RECOVERY SCRIPT: Transmittals & Perms
-- ==========================================

-- 1. Ensure Columns exist
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'INCOMING';
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS package_url TEXT;
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS manifest_url TEXT;
-- Columns present in original schema (just to be sure)
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.transmittals ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Fix Status Constraint (Crucial for INSERT)
ALTER TABLE public.transmittals DROP CONSTRAINT IF EXISTS transmittals_status_check;
ALTER TABLE public.transmittals ADD CONSTRAINT transmittals_status_check 
    CHECK (status IN ('DRAFT', 'SENT', 'RECEIVED', 'ACKNOWLEDGED', 'PENDING_PROCESS', 'PROCESSED'));

-- 3. Force Permissions (Crucial for Access)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT ALL ON public.transmittals TO authenticated;
GRANT ALL ON public.transmittal_items TO authenticated;
GRANT ALL ON public.document_master TO authenticated;
GRANT ALL ON public.document_revisions TO authenticated;
GRANT ALL ON public.document_types TO authenticated;
GRANT ALL ON public.specialties TO authenticated;
GRANT ALL ON public.project_areas TO authenticated;
GRANT ALL ON public.project_document_config TO authenticated;
GRANT ALL ON public.document_event_log TO authenticated;

GRANT ALL ON public.transmittals TO service_role;
GRANT ALL ON public.transmittal_items TO service_role;
GRANT ALL ON public.document_master TO service_role;
GRANT ALL ON public.document_revisions TO service_role;

DO $$ BEGIN
    RAISE NOTICE '✅ FINAL RECOVERY COMPLETE: Columns checked, status fixed, permissions forced.';
END $$;
