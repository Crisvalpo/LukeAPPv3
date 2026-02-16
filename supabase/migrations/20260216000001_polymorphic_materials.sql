-- Evolution: Polymorphic Material Management
-- Decouples material tracking from piping-only spools.

-- 1. Material Requests categorization
ALTER TABLE public.material_requests 
ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.specialties(id);

-- 2. Material Request Items polymorphic target
ALTER TABLE public.material_request_items
ADD COLUMN IF NOT EXISTS target_entity_id uuid,
ADD COLUMN IF NOT EXISTS target_entity_type text DEFAULT 'Piping';

-- 3. Material Receipt Items polymorphic target
ALTER TABLE public.material_receipt_items
ADD COLUMN IF NOT EXISTS target_entity_id uuid,
ADD COLUMN IF NOT EXISTS target_entity_type text DEFAULT 'Piping';

-- 4. Initial Migration of existing data
-- Assume all current requests are 'Piping'
-- We find the 'Piping' specialty ID
DO $$
DECLARE
    piping_id uuid;
BEGIN
    SELECT id INTO piping_id FROM public.specialties WHERE code = 'PIP' LIMIT 1;
    
    IF piping_id IS NOT NULL THEN
        UPDATE public.material_requests SET specialty_id = piping_id WHERE specialty_id IS NULL;
    END IF;
END $$;

-- For items, if they had a spool_id (if we want to keep it as fallback for now)
-- We set target_entity_id to spool_id if spool_id is present.
-- Note: Assuming spool_id in material_request_items is a UUID. 
-- In some schemas it might be a foreign key to spools(id) which is a UUID.
-- If it's a field called 'spool_id' but it's the UUID of the spool, this works.
-- If it's the text code of the spool, we'd need to join.
-- For now, we just add the columns to enable NEW discipline-agnostic entries.
