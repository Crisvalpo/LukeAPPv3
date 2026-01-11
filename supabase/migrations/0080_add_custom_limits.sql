-- Add custom limit columns to companies table
ALTER TABLE public.companies
ADD COLUMN custom_users_limit INTEGER DEFAULT NULL,
ADD COLUMN custom_projects_limit INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.companies.custom_users_limit IS 'Overrides the subscription tier user limit if set';
COMMENT ON COLUMN public.companies.custom_projects_limit IS 'Overrides the subscription tier project limit if set';
