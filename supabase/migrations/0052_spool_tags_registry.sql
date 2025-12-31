-- Migration: Create spool_tags_registry for Management Tags
-- Tags de Gestión: Sistema de identificadores cortos únicos a nivel de proyecto
-- Created: 2024-12-31
-- Description: Global project tags (00001-99999) for simplified spool identification

-- Create tags registry table
CREATE TABLE IF NOT EXISTS spool_tags_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tag Management
  tag_number INTEGER NOT NULL, -- 1, 2, 3, ..., 99999
  tag_suffix TEXT, -- "A", "B", null (for splits)
  tag_display TEXT NOT NULL, -- "00001", "00054-A"
  
  -- Spool Identification
  first_spool_number TEXT NOT NULL, -- "SP-01" (original when created)
  current_spool_number TEXT, -- "SP-01A" (if renamed)
  isometric_id UUID NOT NULL REFERENCES isometrics(id) ON DELETE CASCADE,
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_in_revision_id UUID REFERENCES engineering_revisions(id),
  last_seen_revision_id UUID REFERENCES engineering_revisions(id),
  
  -- Special Operations (Merges/Splits)
  merged_into_tag_id UUID REFERENCES spool_tags_registry(id),
  split_from_tag_id UUID REFERENCES spool_tags_registry(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_tag_per_project UNIQUE(project_id, tag_number, tag_suffix),
  CONSTRAINT unique_tag_display UNIQUE(project_id, tag_display),
  CONSTRAINT valid_tag_status CHECK (status IN ('ACTIVE', 'OBSOLETE', 'MERGED', 'SPLIT'))
);

-- Indexes for performance
CREATE INDEX idx_tags_project ON spool_tags_registry(project_id);
CREATE INDEX idx_tags_isometric ON spool_tags_registry(isometric_id);
CREATE INDEX idx_tags_display ON spool_tags_registry(tag_display);
CREATE INDEX idx_tags_status ON spool_tags_registry(status);
CREATE INDEX idx_tags_number ON spool_tags_registry(project_id, tag_number);

-- Enable RLS
ALTER TABLE spool_tags_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Company-level access
DROP POLICY IF EXISTS tags_company_access ON spool_tags_registry;
CREATE POLICY tags_company_access 
ON spool_tags_registry
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM members WHERE user_id = auth.uid()
  )
);

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_tags_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tags_timestamp ON spool_tags_registry;
CREATE TRIGGER trigger_update_tags_timestamp
  BEFORE UPDATE ON spool_tags_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_tags_timestamp();

-- Add tag columns to spools table
ALTER TABLE spools ADD COLUMN IF NOT EXISTS tag_registry_id UUID REFERENCES spool_tags_registry(id);
ALTER TABLE spools ADD COLUMN IF NOT EXISTS management_tag TEXT; -- Denormalized for fast queries

CREATE INDEX IF NOT EXISTS idx_spools_tag_registry ON spools(tag_registry_id);
CREATE INDEX IF NOT EXISTS idx_spools_management_tag ON spools(management_tag);

-- Helper function: Get next available tag number for a project
CREATE OR REPLACE FUNCTION get_next_tag_number(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_tag INTEGER;
BEGIN
  SELECT COALESCE(MAX(tag_number), 0) INTO max_tag
  FROM spool_tags_registry
  WHERE project_id = p_project_id;
  
  RETURN max_tag + 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Format tag display (00001, 00054-A)
CREATE OR REPLACE FUNCTION format_tag_display(p_tag_number INTEGER, p_tag_suffix TEXT)
RETURNS TEXT AS $$
BEGIN
  IF p_tag_suffix IS NULL THEN
    RETURN LPAD(p_tag_number::TEXT, 5, '0');
  ELSE
    RETURN LPAD(p_tag_number::TEXT, 5, '0') || '-' || p_tag_suffix;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE spool_tags_registry IS 'Registry of management tags for spools (global project IDs: 00001-99999)';
COMMENT ON COLUMN spool_tags_registry.tag_number IS 'Numeric part of tag (1-99999)';
COMMENT ON COLUMN spool_tags_registry.tag_suffix IS 'Letter suffix for splits (A, B, C, etc.)';
COMMENT ON COLUMN spool_tags_registry.tag_display IS 'Formatted display: "00001" or "00054-A"';
COMMENT ON COLUMN spool_tags_registry.status IS 'ACTIVE, OBSOLETE, MERGED, SPLIT';
COMMENT ON COLUMN spool_tags_registry.merged_into_tag_id IS 'If MERGED, points to the tag it was merged into';
COMMENT ON COLUMN spool_tags_registry.split_from_tag_id IS 'If created from a split, points to parent tag';

-- Example queries for verification

-- 1. Get all active tags for a project
-- SELECT tag_display, first_spool_number, status 
-- FROM spool_tags_registry 
-- WHERE project_id = 'YOUR_PROJECT_ID' AND status = 'ACTIVE'
-- ORDER BY tag_number;

-- 2. Find next available tag
-- SELECT get_next_tag_number('YOUR_PROJECT_ID');

-- 3. Check for tag collisions
-- SELECT tag_display, COUNT(*) 
-- FROM spool_tags_registry 
-- WHERE project_id = 'YOUR_PROJECT_ID'
-- GROUP BY tag_display 
-- HAVING COUNT(*) > 1;
