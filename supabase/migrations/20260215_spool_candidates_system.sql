-- Migration: Create spool_candidates table and generation logic
-- Description: Supports the review process for identifying spools from manual MTO
-- Author: LukeAPP v3
-- Date: 2026-02-15

-- 1. Create table
CREATE TABLE IF NOT EXISTS spool_candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    isometric_number text NOT NULL,
    suggested_spool_number text NOT NULL,
    mto_item_ids uuid[] NOT NULL, -- Array of project_mto(id)
    total_weight_kg numeric DEFAULT 0,
    item_count integer DEFAULT 0,
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX idx_spool_candidates_project ON spool_candidates(project_id);
CREATE INDEX idx_spool_candidates_iso ON spool_candidates(isometric_number);

-- 2. RLS Policies
ALTER TABLE spool_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view spool candidates of their projects"
ON spool_candidates FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.project_id = spool_candidates.project_id
        AND members.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage spool candidates"
ON spool_candidates FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.project_id = spool_candidates.project_id
        AND members.user_id = auth.uid()
        AND (members.role_id IN ('admin', 'founder', 'super_admin'))
    )
);

-- 3. Generation Function
CREATE OR REPLACE FUNCTION fn_generate_spool_candidates(p_project_id uuid, p_iso_number text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_company_id uuid;
BEGIN
    -- Get company_id
    SELECT company_id INTO v_company_id FROM projects WHERE id = p_project_id;

    -- Delete existing PENDING candidates for this ISO to avoid duplicates
    DELETE FROM spool_candidates 
    WHERE project_id = p_project_id 
    AND isometric_number = p_iso_number 
    AND status = 'PENDING';

    -- Logic: Group project_mto items by spool_number
    -- Items that already have a spool_number in MTO are the first candidates
    INSERT INTO spool_candidates (
        project_id,
        company_id,
        isometric_number,
        suggested_spool_number,
        mto_item_ids,
        total_weight_kg,
        item_count
    )
    SELECT 
        p_project_id,
        v_company_id,
        p_iso_number,
        COALESCE(spool_number, 'UNASSIGNED-' || floor(random()*1000)::text),
        array_agg(id),
        SUM(COALESCE(calc_weight_total, 0)),
        COUNT(*)
    FROM project_mto
    WHERE project_id = p_project_id
    AND isometric_number = p_iso_number
    GROUP BY spool_number;

END;
$function$;
