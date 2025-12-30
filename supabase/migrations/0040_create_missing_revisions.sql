-- Create missing engineering_revisions from spools_welds data
-- This reconciles the data by creating the revision records

-- First, verify isometrics exist
DO $$
DECLARE
  v_iso_1 UUID;
  v_iso_2 UUID;
  v_project_id UUID := '611f713a-e055-47a7-b227-05a1d478b0ce';
  v_company_id UUID := '44ec230b-5417-4663-b849-92af253d7dde';
BEGIN
  -- Get or create isometric for 3800AE-BBD-380-0403-1
  SELECT id INTO v_iso_1 
  FROM isometrics 
  WHERE iso_number = '3800AE-BBD-380-0403-1';
  
  IF v_iso_1 IS NULL THEN
    INSERT INTO isometrics (id, iso_number, project_id, company_id)
    VALUES (gen_random_uuid(), '3800AE-BBD-380-0403-1', v_project_id, v_company_id)
    RETURNING id INTO v_iso_1;
  END IF;

  -- Get or create isometric for 3800PR-SW-380-5260-1
  SELECT id INTO v_iso_2
  FROM isometrics 
  WHERE iso_number = '3800PR-SW-380-5260-1';
  
  IF v_iso_2 IS NULL THEN
    INSERT INTO isometrics (id, iso_number, project_id, company_id)
    VALUES (gen_random_uuid(), '3800PR-SW-380-5260-1', v_project_id, v_company_id)
    RETURNING id INTO v_iso_2;
  END IF;

  -- Create revision for 3800AE-BBD-380-0403-1 Rev 4
  INSERT INTO engineering_revisions (
    id,
    isometric_id,
    project_id,
    company_id,
    rev_code,
    revision_status,
    data_status,
    material_status,
    created_at
  ) VALUES (
    'dcdcbc4e-62d5-4e14-8105-0636ac15d984',
    v_iso_1,
    v_project_id,
    v_company_id,
    '4',
    'PENDING',
    'VACIO',
    'NO_REQUERIDO',
    '2025-12-29 19:16:58.986712+00'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create revision for 3800PR-SW-380-5260-1 Rev 2
  INSERT INTO engineering_revisions (
    id,
    isometric_id,
    project_id,
    company_id,
    rev_code,
    revision_status,
    data_status,
    material_status,
    created_at
  ) VALUES (
    '2a3c44e9-6a44-4cd7-98f8-e43e6e5bc5df',
    v_iso_2,
    v_project_id,
    v_company_id,
    '2',
    'PENDING',
    'VACIO',
    'NO_REQUERIDO',
    '2025-12-28 02:38:39.489282+00'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Update isometrics to point to current revisions
  UPDATE isometrics 
  SET current_revision_id = 'dcdcbc4e-62d5-4e14-8105-0636ac15d984'
  WHERE id = v_iso_1;

  UPDATE isometrics 
  SET current_revision_id = '2a3c44e9-6a44-4cd7-98f8-e43e6e5bc5df'
  WHERE id = v_iso_2;

END $$;

-- Verification
SELECT 
  er.id,
  er.rev_code,
  er.revision_status,
  i.iso_number,
  (SELECT COUNT(*) FROM spools_welds WHERE revision_id = er.id) as welds_count
FROM engineering_revisions er
JOIN isometrics i ON i.id = er.isometric_id
WHERE er.id IN (
  'dcdcbc4e-62d5-4e14-8105-0636ac15d984',
  '2a3c44e9-6a44-4cd7-98f8-e43e6e5bc5df'
)
ORDER BY i.iso_number;
