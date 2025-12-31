-- Fix RLS policies for engineering_revisions to ensure founders and admins can access
-- This fixes "permission denied" errors when accessing engineering data

-- First, ensure RLS is enabled
ALTER TABLE engineering_revisions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS eng_rev_company_isolation ON engineering_revisions;
DROP POLICY IF EXISTS "Users can view revisions from their companies" ON engineering_revisions;
DROP POLICY IF EXISTS "Users can insert revisions to their companies" ON engineering_revisions;
DROP POLICY IF EXISTS "Users can update revisions from their companies" ON engineering_revisions;

-- Create a single comprehensive policy for all operations
CREATE POLICY engineering_revisions_company_access 
ON engineering_revisions
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_eng_revisions_company_id ON engineering_revisions(company_id);
CREATE INDEX IF NOT EXISTS idx_eng_revisions_project_id ON engineering_revisions(project_id);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'engineering_revisions';
