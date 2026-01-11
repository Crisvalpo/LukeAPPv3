-- Add storage tracking column to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION public.update_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_delta BIGINT;
    v_path_tokens TEXT[];
BEGIN
    -- We only care about the 'project-files' bucket for now as it follows the strict structure
    -- Structure: company_id/project_id/category/filename
    
    -- Handle DELETE
    IF (TG_OP = 'DELETE') THEN
        IF OLD.bucket_id = 'project-files' THEN
            v_path_tokens := string_to_array(OLD.name, '/');
            
            -- Validate path structure (must have at least company_id at index 1)
            IF array_length(v_path_tokens, 1) >= 1 THEN
                BEGIN
                    v_company_id := v_path_tokens[1]::UUID;
                    v_delta := -(OLD.metadata->>'size')::BIGINT;
                    
                    UPDATE public.companies
                    SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) + v_delta)
                    WHERE id = v_company_id;
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore invalid UUIDs or paths
                    RAISE WARNING 'Invalid company_id in storage path: %', v_path_tokens[1];
                END;
            END IF;
        END IF;
        RETURN OLD;
    -- Handle INSERT
    ELSIF (TG_OP = 'INSERT') THEN
        IF NEW.bucket_id = 'project-files' THEN
            v_path_tokens := string_to_array(NEW.name, '/');
            
            IF array_length(v_path_tokens, 1) >= 1 THEN
                BEGIN
                    v_company_id := v_path_tokens[1]::UUID;
                    v_delta := (NEW.metadata->>'size')::BIGINT;
                    
                    UPDATE public.companies
                    SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + v_delta
                    WHERE id = v_company_id;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING 'Invalid company_id in storage path: %', v_path_tokens[1];
                END;
            END IF;
        END IF;
        RETURN NEW;
    -- Handle UPDATE (rare for storage, but possible if metadata changes)
    ELSIF (TG_OP = 'UPDATE') THEN
        IF NEW.bucket_id = 'project-files' THEN
            v_path_tokens := string_to_array(NEW.name, '/');
            
            IF array_length(v_path_tokens, 1) >= 1 THEN
                BEGIN
                    v_company_id := v_path_tokens[1]::UUID;
                    -- Calculate diff
                    v_delta := (NEW.metadata->>'size')::BIGINT - (OLD.metadata->>'size')::BIGINT;
                    
                    IF v_delta <> 0 THEN
                        UPDATE public.companies
                        SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) + v_delta)
                        WHERE id = v_company_id;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING 'Invalid company_id in storage path: %', v_path_tokens[1];
                END;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_storage_update ON storage.objects;
CREATE TRIGGER on_storage_update
AFTER INSERT OR UPDATE OR DELETE ON storage.objects
FOR EACH ROW EXECUTE FUNCTION public.update_storage_usage();

-- BACKFILL: Calculate initial usage for existing files in project-files
WITH calculated_usage AS (
    SELECT 
        (string_to_array(name, '/'))[1]::UUID as company_id,
        SUM((metadata->>'size')::BIGINT) as total_bytes
    FROM storage.objects
    WHERE bucket_id = 'project-files'
    AND (metadata->>'size') IS NOT NULL
    -- Simple regex to check if starts with uuid structure to avoid casting errors
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.*'
    GROUP BY 1
)
UPDATE public.companies c
SET storage_used_bytes = cu.total_bytes
FROM calculated_usage cu
WHERE c.id = cu.company_id;
