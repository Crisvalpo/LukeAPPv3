-- Migration: Atomic approval for spool candidates
-- Description: Converts a candidate into real production spools
-- Author: LukeAPP v3
-- Date: 2026-02-15

CREATE OR REPLACE FUNCTION fn_approve_spool_candidate(p_candidate_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_candidate record;
    v_spool_id uuid;
    v_iso_id uuid;
    v_rev_id uuid;
    v_mto_row record;
    v_mto_id uuid;
BEGIN
    -- 1. Get candidate
    SELECT * INTO v_candidate FROM spool_candidates WHERE id = p_candidate_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not found'; END IF;
    IF v_candidate.status != 'PENDING' THEN RAISE EXCEPTION 'Candidate already processed'; END IF;

    -- 2. Find ISO and Revision
    -- We look for the isometric matching the number in the same project
    SELECT id, rev_id INTO v_iso_id, v_rev_id 
    FROM isometrics 
    WHERE project_id = v_candidate.project_id 
    AND iso_number = v_candidate.isometric_number
    LIMIT 1;

    -- 3. Create Spool
    INSERT INTO spools (
        project_id,
        company_id,
        revision_id,
        spool_number,
        status
    ) VALUES (
        v_candidate.project_id,
        v_candidate.company_id,
        v_rev_id,
        v_candidate.suggested_spool_number,
        'STAGED'
    ) RETURNING id INTO v_spool_id;

    -- 4. Create Spool MTO items from Project MTO
    FOREACH v_mto_id IN ARRAY v_candidate.mto_item_ids
    LOOP
        SELECT * INTO v_mto_row FROM project_mto WHERE id = v_mto_id;
        
        IF FOUND THEN
            INSERT INTO spools_mto (
                spool_id,
                revision_id,
                company_id,
                project_id,
                isometric_number,
                spool_number,
                item_code,
                qty,
                qty_unit,
                master_id,
                dimension_id,
                calc_weight_total,
                calc_takeout_total
            ) VALUES (
                v_spool_id,
                v_rev_id,
                v_candidate.company_id,
                v_candidate.project_id,
                v_candidate.isometric_number,
                v_candidate.suggested_spool_number,
                COALESCE(v_mto_row.commodity_code, 'MTO-ITEM'),
                v_mto_row.quantity,
                v_mto_row.unit,
                v_mto_row.master_id,
                v_mto_row.dimension_id,
                v_mto_row.calc_weight_total,
                v_mto_row.calc_takeout_total
            );
        END IF;
    END LOOP;

    -- 5. Finalize Candidate
    UPDATE spool_candidates 
    SET status = 'APPROVED', updated_at = now() 
    WHERE id = p_candidate_id;

    RETURN v_spool_id;
END;
$function$;
