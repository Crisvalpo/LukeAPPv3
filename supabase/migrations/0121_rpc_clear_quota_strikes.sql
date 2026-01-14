-- =================================================================
-- RPC FUNCTION: Clear Quota Strikes (Manual Staff Action)
-- =================================================================
-- Purpose: Allow LukeAPP staff to manually clear quota strikes for a company
-- Use case: Edge cases where automatic trigger didn't work or immediate cleanup needed
-- =================================================================

CREATE OR REPLACE FUNCTION public.clear_company_quota_strikes(
    p_company_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    -- Delete all quota strikes for the company
    DELETE FROM public.quota_strikes 
    WHERE company_id = p_company_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'company_id', p_company_id,
        'message', format('Se eliminaron %s avisos de cuota', v_deleted_count)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (will be restricted by RLS anyway)
GRANT EXECUTE ON FUNCTION public.clear_company_quota_strikes(UUID) TO authenticated;

COMMENT ON FUNCTION public.clear_company_quota_strikes(UUID) IS
'Manually clears all quota strikes for a company. Intended for LukeAPP staff use via admin panel.';

-- =================================================================
-- VERIFICATION
-- =================================================================

-- Test (replace with actual company_id):
-- SELECT clear_company_quota_strikes('{company-id}');

-- Expected result:
-- {"success": true, "deleted_count": 2, "company_id": "...", "message": "Se eliminaron 2 avisos de cuota"}
