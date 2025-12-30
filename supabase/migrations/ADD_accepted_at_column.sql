-- Add missing 'accepted_at' column to invitations
-- Required by accept_invitation RPC

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

COMMENT ON COLUMN public.invitations.accepted_at IS 'Timestamp when the invitation was accepted';
