-- Add logo_url field to projects table for MIR PDF generation

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN projects.logo_url IS 'URL to project logo stored in Supabase Storage (bucket: project-logos)';

-- Index for faster lookups when generating PDFs
CREATE INDEX IF NOT EXISTS idx_projects_logo_url ON projects(logo_url) WHERE logo_url IS NOT NULL;
