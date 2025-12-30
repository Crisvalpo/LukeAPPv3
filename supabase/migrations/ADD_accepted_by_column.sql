-- Add missing 'accepted_by' column to invitations
-- Required by accept_invitation RPC to track who accepted (user_id)

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.invitations.accepted_by IS 'User ID of the person who accepted the invitation';
