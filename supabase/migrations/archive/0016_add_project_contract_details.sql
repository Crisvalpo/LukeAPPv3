-- Add contract details to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS contract_number text,
ADD COLUMN IF NOT EXISTS client_name text,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date;

COMMENT ON COLUMN public.projects.contract_number IS 'Official contract identifier';
COMMENT ON COLUMN public.projects.client_name IS 'Name of the client organization';
