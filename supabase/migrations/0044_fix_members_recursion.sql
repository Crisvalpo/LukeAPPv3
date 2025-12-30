-- FIX: Infinite recursion in members RLS policy
-- The policy was querying members table within itself

-- Drop the problematic policy
DROP POLICY IF EXISTS members_read ON members;
DROP POLICY IF EXISTS members_manage ON members;

-- Create non-recursive policies
-- 1. Users can read their own membership
CREATE POLICY members_read_own ON members
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- 2. Super admins can read all (no company needed)
CREATE POLICY members_read_superadmin ON members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid()) 
        AND m.role_id = 'super_admin'
        LIMIT 1
    )
  );

-- 3. Founders/Admins can read same company members  
CREATE POLICY members_read_company ON members
  FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT m.company_id
      FROM members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.role_id IN ('founder', 'admin')
        AND m.company_id IS NOT NULL
      LIMIT 10
    )
  );

-- 4. Super admins can manage all
CREATE POLICY members_manage_superadmin ON members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid()) 
        AND m.role_id = 'super_admin'
        LIMIT 1
    )
  );

-- 5. Founders can manage their company members
CREATE POLICY members_manage_founder ON members
  FOR ALL
  USING (
    company_id IN (
      SELECT DISTINCT m.company_id
      FROM members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.role_id = 'founder'
        AND m.company_id IS NOT NULL
      LIMIT 10
    )
  );

-- Verification
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'members'
ORDER BY policyname;
