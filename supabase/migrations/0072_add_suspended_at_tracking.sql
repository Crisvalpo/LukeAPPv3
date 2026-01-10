-- Add tracking for when a company was suspended
-- This enables countdown to data deletion (15 days grace period)

ALTER TABLE public.companies 
ADD COLUMN suspended_at timestamptz;

-- Comment
COMMENT ON COLUMN public.companies.suspended_at IS 'Timestamp when the company was suspended. Used to calculate 15-day grace period before data deletion.';

-- Update existing suspended companies to have a suspended_at date
-- Set to NOW() so countdown starts immediately
UPDATE public.companies 
SET suspended_at = NOW() 
WHERE subscription_status = 'suspended' AND suspended_at IS NULL;
