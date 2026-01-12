-- Fix: Make project-files bucket public for easier access
-- Users still need RLS policies to read/write based on company membership

UPDATE storage.buckets 
SET public = true 
WHERE id = 'project-files';

COMMENT ON TABLE storage.buckets IS 'project-files bucket set to public for direct file access. RLS policies still enforce company-based permissions.';
