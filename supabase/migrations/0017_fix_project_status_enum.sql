-- Drop old constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Normalize existing data to lowercase if any (optional safety step)
UPDATE public.projects SET status = LOWER(status);

-- Add new constraint with all valid statuses from types definition
ALTER TABLE public.projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN (
    'planning', 
    'active', 
    'on_hold', 
    'completed', 
    'cancelled',
    'archived',  -- keep for legacy support
    'suspended'  -- keep for legacy support
));

-- Set default to 'planning'
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'planning';
