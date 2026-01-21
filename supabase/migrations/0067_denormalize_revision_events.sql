-- Migration 0067: Add Denormalized Columns to Revision Events
-- Purpose: Add project_id and company_id to revision_events and revision_impacts
--          for better RLS performance (avoid JOINs)
-- Date: 2026-01-21

-- ============================================================================
-- STEP 1: Add columns to revision_events
-- ============================================================================

ALTER TABLE public.revision_events
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- Backfill existing data
UPDATE public.revision_events re
SET 
  project_id = er.project_id,
  company_id = er.company_id
FROM public.engineering_revisions er
WHERE re.revision_id = er.id;

-- Make columns NOT NULL after backfill
ALTER TABLE public.revision_events
ALTER COLUMN project_id SET NOT NULL,
ALTER COLUMN company_id SET NOT NULL;

-- Create indexes for RLS performance
CREATE INDEX idx_revision_events_project_id ON public.revision_events(project_id);
CREATE INDEX idx_revision_events_company_id ON public.revision_events(company_id);

-- ============================================================================
-- STEP 2: Add columns to revision_impacts
-- ============================================================================

ALTER TABLE public.revision_impacts
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- Backfill existing data
UPDATE public.revision_impacts ri
SET 
  project_id = er.project_id,
  company_id = er.company_id
FROM public.engineering_revisions er
WHERE ri.revision_id = er.id;

-- Make columns NOT NULL after backfill
ALTER TABLE public.revision_impacts
ALTER COLUMN project_id SET NOT NULL,
ALTER COLUMN company_id SET NOT NULL;

-- Create indexes
CREATE INDEX idx_revision_impacts_project_id ON public.revision_impacts(project_id);
CREATE INDEX idx_revision_impacts_company_id ON public.revision_impacts(company_id);

-- ============================================================================
-- STEP 3: Create triggers to auto-populate on INSERT
-- ============================================================================

-- Trigger function to auto-fill project_id and company_id from engineering_revisions
CREATE OR REPLACE FUNCTION auto_fill_revision_event_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Get project_id and company_id from engineering_revisions
  SELECT project_id, company_id
  INTO NEW.project_id, NEW.company_id
  FROM public.engineering_revisions
  WHERE id = NEW.revision_id;
  
  -- If not found, raise exception
  IF NEW.project_id IS NULL THEN
    RAISE EXCEPTION 'Cannot find engineering_revision with id: %', NEW.revision_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to revision_events
CREATE TRIGGER trigger_auto_fill_revision_events_context
BEFORE INSERT ON public.revision_events
FOR EACH ROW
EXECUTE FUNCTION auto_fill_revision_event_context();

-- Apply same trigger to revision_impacts
CREATE TRIGGER trigger_auto_fill_revision_impacts_context
BEFORE INSERT ON public.revision_impacts
FOR EACH ROW
EXECUTE FUNCTION auto_fill_revision_event_context();

-- ============================================================================
-- STEP 4: Update RLS policies for better performance
-- ============================================================================

-- Drop old inefficient policies
DROP POLICY IF EXISTS "Users can view revision_events from their companies" ON public.revision_events;
DROP POLICY IF EXISTS "Users can insert revision_events to their companies" ON public.revision_events;
DROP POLICY IF EXISTS "Users can view revision_impacts from their companies" ON public.revision_impacts;
DROP POLICY IF EXISTS "Users can insert revision_impacts to their companies" ON public.revision_impacts;
DROP POLICY IF EXISTS "Users can update revision_impacts from their companies" ON public.revision_impacts;

-- Create optimized policies for revision_events
CREATE POLICY "revision_events_select_policy" ON public.revision_events
FOR SELECT
USING (
  is_super_admin()
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

CREATE POLICY "revision_events_insert_policy" ON public.revision_events
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

-- Create optimized policies for revision_impacts
CREATE POLICY "revision_impacts_select_policy" ON public.revision_impacts
FOR SELECT
USING (
  is_super_admin()
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

CREATE POLICY "revision_impacts_insert_policy" ON public.revision_impacts
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

CREATE POLICY "revision_impacts_update_policy" ON public.revision_impacts
FOR UPDATE
USING (
  is_super_admin()
  OR
  project_id IN (
    SELECT p.id FROM projects p
    JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = (select auth.uid())
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After this migration:
-- 1. revision_events and revision_impacts have project_id and company_id
-- 2. New inserts auto-populate these columns via trigger
-- 3. RLS policies use direct column checks (no JOINs to engineering_revisions)
-- 4. Performance improved for queries filtering by project/company
