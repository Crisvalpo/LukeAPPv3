/**
 * CLEAN AND RESET ENGINEERING DATA
 * 
 * This script will:
 * 1. Clean all engineering data (revisions, isometrics)
 * 2. Insert 1 clean test isometric
 * 3. Verify the setup
 */

-- ==========================================
-- STEP 1: CLEAN ALL ENGINEERING DATA
-- ==========================================

-- Delete all engineering revisions
DELETE FROM public.engineering_revisions;

-- Delete all isometrics
DELETE FROM public.isometrics;

-- ==========================================
-- STEP 2: INSERT 1 CLEAN TEST ISOMETRIC
-- ==========================================

INSERT INTO public.isometrics (
    id,
    project_id,
    company_id,
    iso_number,
    revision,
    description,
    status,
    area,
    line_type,
    sub_area
) VALUES (
    gen_random_uuid(),
    '611f713a-e055-47a7-b227-05a1d478b0ce', -- Your project_id
    '44ec230b-5417-4663-b849-92af253d7dde', -- Your company_id
    'TEST-ISO-001',
    'A',
    'Clean test isometric for upload validation',
    'VIGENTE',
    'Test Area',
    'Larger Size',
    'Test Sub-Area'
);

-- ==========================================
-- STEP 3: VERIFY
-- ==========================================

SELECT 'Cleanup complete!' as status;

SELECT 
    COUNT(*) as total_isometrics,
    COUNT(DISTINCT company_id) as companies,
    COUNT(DISTINCT project_id) as projects
FROM public.isometrics;

SELECT 
    iso_number,
    revision,
    status,
    area,
    company_id,
    project_id
FROM public.isometrics;
