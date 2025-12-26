-- Migration: Add job_title to members and invitations
-- Description: Allows custom role labels like 'Oficina Técnica' while keeping system roles.

ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS job_title text;

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS job_title text;

-- Optional: Update existing members to have a default title based on their role description?
-- For now, leave null or let application handle defaults.
