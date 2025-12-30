-- =====================================================
-- 0014b: Revision Events & Impacts (Extracted from 0014)
-- =====================================================
-- Description: Creates the event logging tables. 
--              Must run AFTER 0016 (which creates engineering_revisions).
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_revision_events_revision ON public.revision_events(revision_id);
CREATE INDEX IF NOT EXISTS idx_revision_events_type ON public.revision_events(event_type);
CREATE INDEX IF NOT EXISTS idx_revision_events_created_at ON public.revision_events(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_revision_impacts_revision ON public.revision_impacts(revision_id);
CREATE INDEX IF NOT EXISTS idx_revision_impacts_entity ON public.revision_impacts(affected_entity_type, affected_entity_id);
CREATE INDEX IF NOT EXISTS idx_revision_impacts_severity ON public.revision_impacts(severity);
CREATE INDEX IF NOT EXISTS idx_revision_impacts_resolved ON public.revision_impacts(resolved_at);

COMMENT ON TABLE public.revision_impacts IS 'Detected impacts from revision changes on existing production';

-- RLS POLICIES

ALTER TABLE public.revision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_impacts ENABLE ROW LEVEL SECURITY;

-- REVISION EVENTS POLICIES
CREATE POLICY "Users can view revision_events from their companies"
  ON public.revision_events FOR SELECT
  USING (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE project_id IN (
        SELECT p.id FROM public.projects p
        INNER JOIN public.members m ON m.company_id = p.company_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert revision_events to their companies"
  ON public.revision_events FOR INSERT
  WITH CHECK (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE project_id IN (
        SELECT p.id FROM public.projects p
        INNER JOIN public.members m ON m.company_id = p.company_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

-- REVISION IMPACTS POLICIES
CREATE POLICY "Users can view revision_impacts from their companies"
  ON public.revision_impacts FOR SELECT
  USING (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE project_id IN (
        SELECT p.id FROM public.projects p
        INNER JOIN public.members m ON m.company_id = p.company_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert revision_impacts to their companies"
  ON public.revision_impacts FOR INSERT
  WITH CHECK (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE project_id IN (
        SELECT p.id FROM public.projects p
        INNER JOIN public.members m ON m.company_id = p.company_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update revision_impacts from their companies"
  ON public.revision_impacts FOR UPDATE
  USING (
    revision_id IN (
      SELECT id FROM public.engineering_revisions
      WHERE project_id IN (
        SELECT p.id FROM public.projects p
        INNER JOIN public.members m ON m.company_id = p.company_id
        WHERE m.user_id = auth.uid()
      )
    )
  );

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_revision_impacts_updated_at BEFORE UPDATE ON public.revision_impacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
