-- Add direction and package tracking to transmittals
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmittal_direction') THEN
    CREATE TYPE transmittal_direction AS ENUM ('INCOMING', 'OUTGOING');
  END IF;
END $$;

ALTER TABLE public.transmittals 
ADD COLUMN IF NOT EXISTS direction transmittal_direction DEFAULT 'OUTGOING',
ADD COLUMN IF NOT EXISTS package_url TEXT,
ADD COLUMN IF NOT EXISTS manifest_url TEXT;

-- Update existing transmittals to be OUTGOING
UPDATE public.transmittals SET direction = 'OUTGOING' WHERE direction IS NULL;
