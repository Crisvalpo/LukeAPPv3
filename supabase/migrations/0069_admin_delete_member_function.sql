-- Migration 0069: Create Admin Helper Function for Deleting Members
-- Purpose: Create a SECURITY DEFINER function that bypasses RLS for admin operations
-- Date: 2026-01-21

CREATE OR REPLACE FUNCTION admin_delete_member(target_member_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_member json;
BEGIN
  -- Delete the member and return the deleted record
  DELETE FROM members 
  WHERE id = target_member_id
  RETURNING json_build_object(
    'id', id,
    'user_id', user_id,
    'company_id', company_id,
    'role_id', role_id
  ) INTO deleted_member;
  
  IF deleted_member IS NULL THEN
    RAISE EXCEPTION 'Member not found: %', target_member_id;
  END IF;
  
  RETURN deleted_member;
END;
$$;

-- Grant execute to authenticated users (will be called from API with service role)
GRANT EXECUTE ON FUNCTION admin_delete_member(uuid) TO authenticated, service_role;
