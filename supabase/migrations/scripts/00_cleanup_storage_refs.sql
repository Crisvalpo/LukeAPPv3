-- DANGER: This script will delete ALL project data related to files
-- Use this ONLY if you intend to wipe the buckets and start over.

-- 1. Clear Structure Models
TRUNCATE TABLE public.structure_models CASCADE;

-- 2. Clear Revisions (Isometrics) Model URLs
-- We don't want to delete the revisions themselves (historical data),
-- but we will clear the model URLs since the files will be gone.
UPDATE public.engineering_revisions
SET glb_model_url = NULL,
    model_data = NULL
WHERE glb_model_url IS NOT NULL;

-- 3. Clear Project Logos
UPDATE public.projects
SET logo_primary_url = NULL,
    logo_secondary_url = NULL,
    logo_primary_crop = NULL,
    logo_secondary_crop = NULL;

-- 4. Reset Project Locations (since they might have associated maps/images in future)
-- (Optional, if you have location files)
-- TRUNCATE TABLE public.project_locations CASCADE;
