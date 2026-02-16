-- Migration: Add Primary Specialty to Members and Invitations
-- Description: Allows associating a user with a specific discipline context.

-- 1. Add column to members
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS primary_specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.members.primary_specialty_id IS 'The primary industrial discipline for this member (optional, for UX context)';

-- 2. Add column to invitations
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS primary_specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.invitations.primary_specialty_id IS 'The primary specialty to assign when the invitation is accepted';

-- 3. Update Indexes
CREATE INDEX IF NOT EXISTS idx_members_primary_specialty ON public.members(primary_specialty_id);
CREATE INDEX IF NOT EXISTS idx_invitations_primary_specialty ON public.invitations(primary_specialty_id);
