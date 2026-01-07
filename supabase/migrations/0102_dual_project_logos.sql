-- Upgrade to dual logo support with crop settings
-- Migration: 0102_dual_project_logos.sql

-- Remove old single logo column
ALTER TABLE projects DROP COLUMN IF EXISTS logo_url;

-- Add dual logo support
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS logo_primary_url TEXT,
ADD COLUMN IF NOT EXISTS logo_secondary_url TEXT,
ADD COLUMN IF NOT EXISTS logo_primary_crop JSONB,
ADD COLUMN IF NOT EXISTS logo_secondary_crop JSONB;

-- Comments
COMMENT ON COLUMN projects.logo_primary_url IS 'Primary logo URL (e.g., Company logo) in Storage';
COMMENT ON COLUMN projects.logo_secondary_url IS 'Secondary logo URL (e.g., Client logo) in Storage';
COMMENT ON COLUMN projects.logo_primary_crop IS 'Crop settings JSON: {x, y, width, height, zoom, rotation}';
COMMENT ON COLUMN projects.logo_secondary_crop IS 'Crop settings JSON: {x, y, width, height, zoom, rotation}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_logo_primary 
ON projects(logo_primary_url) WHERE logo_primary_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_logo_secondary 
ON projects(logo_secondary_url) WHERE logo_secondary_url IS NOT NULL;
