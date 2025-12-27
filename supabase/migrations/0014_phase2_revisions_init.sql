-- =====================================================
-- Phase 2: Revision System - Foundation
-- =====================================================
-- Description: Core tables for event-driven revision management
--              + Mockup production tables for testing
-- Author: LukeAPP Development Team
-- Date: 2025-12-27
-- =====================================================

-- =====================================================
-- PART 1: MOCKUP PRODUCTION TABLES (Temporary)
-- =====================================================
-- Note: These are SIMPLIFIED versions for testing.
-- When field execution phase is implemented, replace with full versions.

-- 1. ISOMETRICS (Engineering Drawings)
CREATE TABLE IF NOT EXISTS public.isometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  iso_number TEXT NOT NULL,
  revision TEXT NOT NULL DEFAULT 'A',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT isometrics_project_iso_unique UNIQUE(project_id, iso_number)
);

CREATE INDEX idx_isometrics_project ON public.isometrics(project_id);
CREATE INDEX idx_isometrics_company ON public.isometrics(company_id);
CREATE INDEX idx_isometrics_revision ON public.isometrics(revision);

COMMENT ON TABLE public.isometrics IS 'MOCKUP: Simplified isometric drawings for revision testing';

-- 2. SPOOLS (Pipe Segments)
CREATE TABLE IF NOT EXISTS public.spools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isometric_id UUID NOT NULL REFERENCES public.isometrics(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  spool_number TEXT NOT NULL,
  revision TEXT NOT NULL DEFAULT 'A',
  fabrication_status TEXT NOT NULL DEFAULT 'PENDING',
    -- PENDING, FABRICATED, DISPATCHED, INSTALLED
  fabricated_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT spools_project_number_unique UNIQUE(project_id, spool_number),
  CONSTRAINT spools_fabrication_status_check CHECK (
    fabrication_status IN ('PENDING', 'FABRICATED', 'DISPATCHED', 'INSTALLED')
  )
);

CREATE INDEX idx_spools_isometric ON public.spools(isometric_id);
CREATE INDEX idx_spools_project ON public.spools(project_id);
CREATE INDEX idx_spools_status ON public.spools(fabrication_status);

COMMENT ON TABLE public.spools IS 'MOCKUP: Simplified spools for revision testing';

-- 3. WELDS (Joints)
CREATE TABLE IF NOT EXISTS public.welds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spool_id UUID NOT NULL REFERENCES public.spools(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  weld_number TEXT NOT NULL,
  weld_type TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
    -- PENDING, EXECUTED, QA_APPROVED, QA_REJECTED
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT welds_project_number_unique UNIQUE(project_id, weld_number),
  CONSTRAINT welds_status_check CHECK (
    status IN ('PENDING', 'EXECUTED', 'QA_APPROVED', 'QA_REJECTED')
  )
);

CREATE INDEX idx_welds_spool ON public.welds(spool_id);
CREATE INDEX idx_welds_project ON public.welds(project_id);
CREATE INDEX idx_welds_status ON public.welds(status);

COMMENT ON TABLE public.welds IS 'MOCKUP: Simplified welds for revision testing';

-- =====================================================
-- PART 2: CORE REVISION SYSTEM TABLES
-- =====================================================

-- 4. ENGINEERING REVISIONS (Event Header)
CREATE TABLE IF NOT EXISTS public.engineering_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rev_id TEXT NOT NULL, -- e.g., 'B', 'C', 'D'
  entity_type TEXT NOT NULL, -- 'isometric', 'line', 'spool'
  entity_id UUID NOT NULL, -- Reference to the entity (e.g., iso metric_id)
  status TEXT NOT NULL DEFAULT 'DRAFT',
    -- DRAFT, PENDING, APPROVED, APPLIED, REJECTED
  announced_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT engineering_revisions_status_check CHECK (
    status IN ('DRAFT', 'PENDING', 'APPROVED', 'APPLIED', 'REJECTED')
  )
);

CREATE INDEX idx_engineering_revisions_project ON public.engineering_revisions(project_id);
CREATE INDEX idx_engineering_revisions_company ON public.engineering_revisions(company_id);
CREATE INDEX idx_engineering_revisions_status ON public.engineering_revisions(status);
CREATE INDEX idx_engineering_revisions_entity ON public.engineering_revisions(entity_type, entity_id);

COMMENT ON TABLE public.engineering_revisions IS 'Event header for engineering change announcements';

-- 5. REVISION EVENTS (Immutable Event Log)
CREATE TABLE IF NOT EXISTS public.revision_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES public.engineering_revisions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
    -- CREATED, ANNOUNCED, IMPACT_DETECTED, APPROVED, APPLIED, REJECTED, RESOLVED
  payload JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT revision_events_type_check CHECK (
    event_type IN ('CREATED', 'ANNOUNCED', 'IMPACT_DETECTED', 'APPROVED', 'APPLIED', 'REJECTED', 'RESOLVED')
  )
);

CREATE INDEX idx_revision_events_revision ON public.revision_events(revision_id);
CREATE INDEX idx_revision_events_type ON public.revision_events(event_type);
CREATE INDEX idx_revision_events_created_at ON public.revision_events(created_at DESC);

COMMENT ON TABLE public.revision_events IS 'Immutable event log for revision lifecycle (Event Sourcing)';

-- 6. REVISION IMPACTS (Detected Conflicts)
CREATE TABLE IF NOT EXISTS public.revision_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES public.engineering_revisions(id) ON DELETE CASCADE,
  impact_type TEXT NOT NULL,
    -- NEW, MODIFIED, REMOVED, MATERIAL_CHANGE
  affected_entity_type TEXT NOT NULL, -- 'spool', 'weld'
  affected_entity_id UUID NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
    -- LOW, MEDIUM, HIGH, CRITICAL
  resolution_type TEXT,
    -- REWORK, MATERIAL_RETURN, FREE_JOINT, TECHNICAL_EXCEPTION, CLIENT_APPROVAL
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT revision_impacts_type_check CHECK (
    impact_type IN ('NEW', 'MODIFIED', 'REMOVED', 'MATERIAL_CHANGE')
  ),
  CONSTRAINT revision_impacts_severity_check CHECK (
    severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),
  CONSTRAINT revision_impacts_resolution_check CHECK (
    resolution_type IS NULL OR resolution_type IN (
      'REWORK', 'MATERIAL_RETURN', 'FREE_JOINT', 'TECHNICAL_EXCEPTION', 'CLIENT_APPROVAL'
    )
  )
);

CREATE INDEX idx_revision_impacts_revision ON public.revision_impacts(revision_id);
CREATE INDEX idx_revision_impacts_entity ON public.revision_impacts(affected_entity_type, affected_entity_id);
CREATE INDEX idx_revision_impacts_severity ON public.revision_impacts(severity);
CREATE INDEX idx_revision_impacts_resolved ON public.revision_impacts(resolved_at);

COMMENT ON TABLE public.revision_impacts IS 'Detected impacts from revision changes on existing production';

-- =====================================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.isometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineering_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_impacts ENABLE ROW LEVEL SECURITY;

-- ========== ISOMETRICS POLICIES ==========
CREATE POLICY "Users can view isometrics from their companies"
  ON public.isometrics FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert isometrics to their companies"
  ON public.isometrics FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update isometrics from their companies"
  ON public.isometrics FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ========== SPOOLS POLICIES ==========
CREATE POLICY "Users can view spools from their companies"
  ON public.spools FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert spools to their companies"
  ON public.spools FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update spools from their companies"
  ON public.spools FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ========== WELDS POLICIES ==========
CREATE POLICY "Users can view welds from their companies"
  ON public.welds FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert welds to their companies"
  ON public.welds FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update welds from their companies"
  ON public.welds FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ========== ENGINEERING REVISIONS POLICIES ==========
CREATE POLICY "Users can view revisions from their companies"
  ON public.engineering_revisions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert revisions to their companies"
  ON public.engineering_revisions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update revisions from their companies"
  ON public.engineering_revisions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ========== REVISION EVENTS POLICIES ==========
CREATE POLICY "Users can view revision_events from their companies"
  ON public.revision_events FOR SELECT
  USING (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE company_id IN (
        SELECT company_id FROM public.members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert revision_events to their companies"
  ON public.revision_events FOR INSERT
  WITH CHECK (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE company_id IN (
        SELECT company_id FROM public.members WHERE user_id = auth.uid()
      )
    )
  );

-- ========== REVISION IMPACTS POLICIES ==========
CREATE POLICY "Users can view revision_impacts from their companies"
  ON public.revision_impacts FOR SELECT
  USING (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE company_id IN (
        SELECT company_id FROM public.members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert revision_impacts to their companies"
  ON public.revision_impacts FOR INSERT
  WITH CHECK (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE company_id IN (
        SELECT company_id FROM public.members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update revision_impacts from their companies"
  ON public.revision_impacts FOR UPDATE
  USING (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE company_id IN (
        SELECT company_id FROM public.members WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- PART 4: TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_isometrics_updated_at BEFORE UPDATE ON public.isometrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spools_updated_at BEFORE UPDATE ON public.spools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_welds_updated_at BEFORE UPDATE ON public.welds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engineering_revisions_updated_at BEFORE UPDATE ON public.engineering_revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revision_impacts_updated_at BEFORE UPDATE ON public.revision_impacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
