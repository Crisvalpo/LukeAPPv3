-- MEGA SYNC FIX PATCH: Final Alignment
-- Fixes missing columns in projects, spools, and members that were overlooked.

DO $$ 
BEGIN
    RAISE NOTICE '🚀 Applying Mega Sync Fix Patch...';

    ---------------------------------------------------------
    -- 1. Table: projects
    ---------------------------------------------------------
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS code text;
    -- Note: We add it as nullable first to avoid errors with existing data, then we could set default
    ALTER TABLE public.projects ALTER COLUMN code SET NOT NULL; 
    -- If setting NOT NULL fails because of existing data, you might need to:
    -- UPDATE public.projects SET code = 'PROJ-' || id::text WHERE code IS NULL;
    
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contract_number text DEFAULT 'S/N';
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_name text DEFAULT 'Cliente Interno';
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS week_end_day integer DEFAULT 6;

    ---------------------------------------------------------
    -- 2. Table: spools
    ---------------------------------------------------------
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS spool_number text;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING';
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS total_welds integer DEFAULT 0;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS shop_welds integer DEFAULT 0;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS field_welds integer DEFAULT 0;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS total_inches numeric DEFAULT 0;
    
    -- Ensure NOT NULL if required by your logic (in Cloud it is NOT NULL)
    -- ALTER TABLE public.spools ALTER COLUMN spool_number SET NOT NULL;

    ---------------------------------------------------------
    -- 3. Table: members
    ---------------------------------------------------------
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS job_title text;
    ALTER TABLE public.members ADD COLUMN IF NOT EXISTS functional_role_id uuid REFERENCES public.company_roles(id);

    ---------------------------------------------------------
    -- 4. Table: companies (Logo and Limits)
    ---------------------------------------------------------
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_projects_limit integer;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_users_limit integer;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS rut text;

    RAISE NOTICE '✅ Mega Sync Fix Patch applied successfully!';

END $$;
