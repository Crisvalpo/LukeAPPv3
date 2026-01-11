-- Add custom overrides for plan limits
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS custom_projects_limit INTEGER,
ADD COLUMN IF NOT EXISTS custom_users_limit INTEGER;
