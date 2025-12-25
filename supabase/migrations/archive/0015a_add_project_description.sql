-- Add description column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS description text;

-- Add comment to column
COMMENT ON COLUMN public.projects.description IS 'Optional description or details about the project';
