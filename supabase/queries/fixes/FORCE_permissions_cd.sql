-- EMERGENCY PERMISSION FIX FOR DOCUMENT CONTROL
-- Run this script to force permissions on all CD tables

DO $$ 
BEGIN
    RAISE NOTICE '🔧 Applying Emergency Permissions Fix for Document Control...';

    -- 1. Ensure PUBLIC schema usage
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT USAGE ON SCHEMA public TO anon;

    -- 2. Force Grant ALL on key tables to authenticated
    GRANT ALL ON public.transmittals TO authenticated;
    GRANT ALL ON public.transmittal_items TO authenticated;
    GRANT ALL ON public.document_master TO authenticated;
    GRANT ALL ON public.document_revisions TO authenticated;
    GRANT ALL ON public.document_types TO authenticated;
    GRANT ALL ON public.specialties TO authenticated;
    GRANT ALL ON public.project_areas TO authenticated;
    GRANT ALL ON public.project_document_config TO authenticated;
    GRANT ALL ON public.document_event_log TO authenticated;

    -- 3. Also grant to service_role (just in case)
    GRANT ALL ON public.transmittals TO service_role;
    GRANT ALL ON public.transmittal_items TO service_role;
    GRANT ALL ON public.document_master TO service_role;
    GRANT ALL ON public.document_revisions TO service_role;

    RAISE NOTICE '✅ Permissions granted successfully.';
END $$;
