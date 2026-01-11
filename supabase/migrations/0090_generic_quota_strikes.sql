-- Make quota_strikes generic
ALTER TABLE public.quota_strikes
ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'spool',
ALTER COLUMN spool_count DROP NOT NULL;

-- Rename spool_count to usage_snapshot if possible, or just add a new column for clarity?
-- Let's just keep spool_count for backward compat and add 'usage_value' (bigint) for generic use
ALTER TABLE public.quota_strikes
ADD COLUMN IF NOT EXISTS usage_value BIGINT;

-- Backfill usage_value from spool_count
UPDATE public.quota_strikes
SET usage_value = spool_count
WHERE usage_value IS NULL;

-- Function trigger isn't needed here, logic is in detailed service
