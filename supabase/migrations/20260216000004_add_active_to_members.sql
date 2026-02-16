-- Migration: Add active status to members
-- Purpose: Support deactivation (soft delete) to preserve audit history
-- Date: 2026-02-16

-- 1. Add the active column
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Update existing records to be active
UPDATE public.members 
SET active = true 
WHERE active IS NULL;

-- 3. Update RLS policies to consider active status by default
-- Note: Super Admin and Ghost Admin bypass this check for management purposes.

-- we don't want to break existing RLS, but for search/listing we'll use filters in the UI/Services.
-- However, we can add a comment to remind future developers.
COMMENT ON COLUMN public.members.active IS 'Indicates if the member is currently active in the company/project (Soft Delete support).';
