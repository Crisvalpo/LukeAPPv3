-- PERFORMANCE FIX: Critical high-traffic tables only
-- Fixes auth_rls_initplan and multiple_permissive_policies warnings
-- Tables: engineering_revisions, spools_welds, isometrics, users, members, projects

-- ============================================
-- 1. ENGINEERING_REVISIONS (Critical)
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS eng_rev_company_isolation ON engineering_revisions;

-- Create optimized policy
CREATE POLICY eng_rev_company_isolation ON engineering_revisions
  FOR ALL
  USING (
    company_id IN (
      SELECT m.company_id 
      FROM members m
      WHERE m.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 2. SPOOLS_WELDS (High volume)
-- ============================================

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can view spools_welds" ON spools_welds;
DROP POLICY IF EXISTS "Users can manage spools_welds" ON spools_welds;

-- Create single consolidated policy
CREATE POLICY spools_welds_company_access ON spools_welds
  FOR ALL
  USING (
    company_id IN (
      SELECT m.company_id 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 3. ISOMETRICS (Frequent queries)
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view isometrics from their companies" ON isometrics;
DROP POLICY IF EXISTS "Users can insert isometrics to their companies" ON isometrics;
DROP POLICY IF EXISTS "Users can update isometrics from their companies" ON isometrics;

-- Create single consolidated policy
CREATE POLICY isometrics_company_access ON isometrics
  FOR ALL
  USING (
    company_id IN (
      SELECT m.company_id 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 4. USERS (Auth on every request)
-- ============================================

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Read own profile" ON users;
DROP POLICY IF EXISTS "Staff read all profiles" ON users;

-- Create optimized policies
CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY users_staff_read_all ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.role_id = 'super_admin'
    )
  );

-- Drop duplicate update policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Update own profile" ON users;

-- Create single update policy
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = (SELECT auth.uid()));

-- ============================================
-- 5. MEMBERS (Permission checks)
-- ============================================

-- Drop duplicate policies
DROP POLICY IF EXISTS "Founder manage company members" ON members;
DROP POLICY IF EXISTS "Staff full access members" ON members;
DROP POLICY IF EXISTS "Read own membership" ON members;

-- Create consolidated policies
CREATE POLICY members_read ON members
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR company_id IN (
      SELECT m.company_id 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid())
        AND m.role_id IN ('founder', 'super_admin')
    )
  );

CREATE POLICY members_manage ON members
  FOR ALL
  USING (
    company_id IN (
      SELECT m.company_id 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid())
        AND m.role_id IN ('founder', 'super_admin')
    )
  );

-- ============================================
-- 6. PROJECTS (Context switching)
-- ============================================

-- Drop duplicate policies
DROP POLICY IF EXISTS "Founder full access projects" ON projects;
DROP POLICY IF EXISTS "Staff full access projects" ON projects;
DROP POLICY IF EXISTS "Member read assigned projects" ON projects;

-- Create consolidated policies
CREATE POLICY projects_read ON projects
  FOR SELECT
  USING (
    company_id IN (
      SELECT m.company_id 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY projects_manage ON projects
  FOR ALL
  USING (
    company_id IN (
      SELECT m.company_id 
      FROM members m 
      WHERE m.user_id = (SELECT auth.uid())
        AND m.role_id IN ('founder', 'super_admin')
    )
  );

-- Verification: Check policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN (
  'engineering_revisions', 
  'spools_welds', 
  'isometrics', 
  'users', 
  'members', 
  'projects'
)
ORDER BY tablename, policyname;
