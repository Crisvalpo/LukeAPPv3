-- FIX: RLS Policy for project_locations
-- Description: Improve visibility for project locations by simplifying the policy
-- Previously: Access was strictly tied to company_id match in 'members' table
-- Fix: Ensure the user is authenticated and part of the company.

-- Drop existing policy
DROP POLICY IF EXISTS project_locations_company_access ON project_locations;

-- Create a more robust policy associated with company membership check
CREATE POLICY "Enable access for users in the same company"
ON project_locations
FOR ALL
USING (
    company_id IN (
        SELECT company_id 
        FROM members 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    company_id IN (
        SELECT company_id 
        FROM members 
        WHERE user_id = auth.uid()
    )
);

-- Additionally, allow access if the user is a super-admin or system owner (optional safeguard)
-- But for now, let's just make sure the public policy is clear.

-- VERIFY RLS is enabled
ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;

-- If 'spool_tags_registry' has similar issues, fix it too
DROP POLICY IF EXISTS spool_tags_registry_company_access ON spool_tags_registry;

CREATE POLICY "Enable access for users in the same company tags"
ON spool_tags_registry
FOR ALL
USING (
    company_id IN (
        SELECT company_id 
        FROM members 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    company_id IN (
        SELECT company_id 
        FROM members 
        WHERE user_id = auth.uid()
    )
);
