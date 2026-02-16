DO $$ 
DECLARE
    v_company_id uuid := '4775cc52-d1d8-4074-9fff-faaa2e248af3';
    v_project_id uuid;
    v_area_id uuid;
    v_work_front_id uuid;
    v_piping_id uuid;
    v_electrical_id uuid;
    v_request_id uuid;
BEGIN
    -- 1. Create Project
    INSERT INTO public.projects (name, code, company_id, status)
    VALUES ('Project Alpha', 'PRJ-A', v_company_id, 'active')
    RETURNING id INTO v_project_id;

    -- 2. Activate Specialties for Project
    SELECT id INTO v_piping_id FROM public.specialties WHERE code = 'PIP';
    SELECT id INTO v_electrical_id FROM public.specialties WHERE code = 'ELE';

    INSERT INTO public.project_specialties (project_id, specialty_id, is_active)
    VALUES (v_project_id, v_piping_id, true),
           (v_project_id, v_electrical_id, true);

    -- 3. Create Area (CWA)
    INSERT INTO public.areas (project_id, company_id, name, code, description)
    VALUES (v_project_id, v_company_id, 'CWA-01 - Heavy Processing', 'CWA01', 'Area de procesamiento pesado')
    RETURNING id INTO v_area_id;

    -- 4. Create Work Front (IWP)
    INSERT INTO public.work_fronts (area_id, project_id, company_id, name, code, status, priority)
    VALUES (v_area_id, v_project_id, v_company_id, 'IWP-01 - Pump Station', 'IWP01', 'PLANNING', 1)
    RETURNING id INTO v_work_front_id;

    -- 5. Create Polymorphic Material Request for the Work Front
    INSERT INTO public.material_requests (project_id, company_id, request_type, status, notes, specialty_id)
    VALUES (v_project_id, v_company_id, 'CONTRACTOR_PO', 'DRAFT', 'Polymorphic Request for IWP-01', v_piping_id)
    RETURNING id INTO v_request_id;

    -- 6. Add Items (Piping and Electrical) linked to the Work Front
    INSERT INTO public.material_request_items 
    (request_id, material_spec, quantity_requested, target_entity_id, target_entity_type, quantity_received)
    VALUES 
    (v_request_id, 'Gate Valve 4" 150#', 5, v_work_front_id, 'WorkFront', 0),
    (v_request_id, 'Power Cable 3x50mm2', 120, v_work_front_id, 'WorkFront', 0);

    RAISE NOTICE 'Test Data Created Successfully for Project Alpha';
END $$;
