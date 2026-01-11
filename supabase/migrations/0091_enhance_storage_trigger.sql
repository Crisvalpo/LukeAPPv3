CREATE OR REPLACE FUNCTION public.update_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_project_id UUID;
    v_delta BIGINT;
    v_path_tokens TEXT[];
    v_filename TEXT;
BEGIN
    -- INIT: Calculate Delta
    IF (TG_OP = 'DELETE') THEN
        v_delta := -(OLD.metadata->>'size')::BIGINT;
        v_filename := OLD.name;
    ELSIF (TG_OP = 'INSERT') THEN
        v_delta := (NEW.metadata->>'size')::BIGINT;
        v_filename := NEW.name;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_delta := (NEW.metadata->>'size')::BIGINT - (OLD.metadata->>'size')::BIGINT;
        v_filename := NEW.name; -- Assuming name doesn't change on update usually
        IF v_delta = 0 THEN RETURN NEW; END IF;
    END IF;

    -- CASE 1: New 'project-files' bucket
    -- Path: company_id/project_id/category/filename
    IF (TG_OP = 'DELETE' AND OLD.bucket_id = 'project-files') OR (TG_OP <> 'DELETE' AND NEW.bucket_id = 'project-files') THEN
        v_path_tokens := string_to_array(v_filename, '/');
        IF array_length(v_path_tokens, 1) >= 1 THEN
            BEGIN
                v_company_id := v_path_tokens[1]::UUID;
                UPDATE public.companies
                SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) + v_delta)
                WHERE id = v_company_id;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Invalid company_id in storage path: %', v_path_tokens[1];
            END;
        END IF;

    -- CASE 2: Legacy 'project-logos'
    -- Path: {projectId}_{timestamp}.ext OR {projectId}/filename (older)
    ELSIF (TG_OP = 'DELETE' AND OLD.bucket_id = 'project-logos') OR (TG_OP <> 'DELETE' AND NEW.bucket_id = 'project-logos') THEN
        -- Attempt to extract UUID from start of filename
        BEGIN
            -- Regex to extract UUID at start
            v_project_id := substring(v_filename FROM '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')::UUID;
            
            IF v_project_id IS NOT NULL THEN
                SELECT company_id INTO v_company_id FROM public.projects WHERE id = v_project_id;
                IF v_company_id IS NOT NULL THEN
                    UPDATE public.companies
                    SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) + v_delta)
                    WHERE id = v_company_id;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not extract project_id from logo filename: %', v_filename;
        END;

    -- CASE 3: Legacy 'structure-models' & 'isometric-models'
    -- Path: {projectId}-filename.glb
    ELSIF (TG_OP = 'DELETE' AND OLD.bucket_id IN ('structure-models', 'isometric-models')) OR (TG_OP <> 'DELETE' AND NEW.bucket_id IN ('structure-models', 'isometric-models')) THEN
        BEGIN
             -- Regex to extract UUID at start (works for both {uuid}_... and {uuid}-...)
            v_project_id := substring(v_filename FROM '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')::UUID;
             
            IF v_project_id IS NOT NULL THEN
                SELECT company_id INTO v_company_id FROM public.projects WHERE id = v_project_id;
                IF v_company_id IS NOT NULL THEN
                    UPDATE public.companies
                    SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) + v_delta)
                    WHERE id = v_company_id;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not extract project_id from model filename: %', v_filename;
        END;
    END IF;

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BACKFILL LEGACY BUCKETS
WITH legacy_logos AS (
    SELECT 
        p.company_id,
        SUM((so.metadata->>'size')::BIGINT) as total_bytes
    FROM storage.objects so
    JOIN public.projects p ON p.id::text = substring(so.name FROM '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    WHERE so.bucket_id = 'project-logos'
    GROUP BY 1
)
UPDATE public.companies c
SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + ll.total_bytes
FROM legacy_logos ll
WHERE c.id = ll.company_id;

WITH legacy_models AS (
    SELECT 
        p.company_id,
        SUM((so.metadata->>'size')::BIGINT) as total_bytes
    FROM storage.objects so
    JOIN public.projects p ON p.id::text = substring(so.name FROM '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    WHERE so.bucket_id IN ('structure-models', 'isometric-models')
    GROUP BY 1
)
UPDATE public.companies c
SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + lm.total_bytes
FROM legacy_models lm
WHERE c.id = lm.company_id;
