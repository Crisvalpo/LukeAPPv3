-- MEGA SYNC: Cloud to Local Alignment
-- This script reconciles differences found between production and local schema.
-- Uses idempotent checks to avoid errors if columns already exist.

DO $$ 
BEGIN
    RAISE NOTICE '🚀 Starting Mega Sync: Cloud to Local alignment...';

    ---------------------------------------------------------
    -- 1. CUSTOM TYPES (ENUMS)
    ---------------------------------------------------------
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cutting_status') THEN
        CREATE TYPE public.cutting_status AS ENUM ('PENDING', 'CUT', 'LABELED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
        CREATE TYPE public.delivery_status AS ENUM ('DRAFT', 'PLANNED', 'SENT', 'RECEIVED', 'CANCELLED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipe_location') THEN
        CREATE TYPE public.pipe_location AS ENUM ('WAREHOUSE', 'IN_TRANSIT', 'WORKSHOP', 'SCRAP', 'INSTALLED');
    END IF;

    -- Update subscription_status if needed
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        BEGIN
            ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'past_due';
        EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Enum subscription_status update skipped (standard behavior)';
        END;
    END IF;

    ---------------------------------------------------------
    -- 2. ENHANCE TABLES (Add missing columns)
    ---------------------------------------------------------

    -- Table: companies
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_projects_limit integer;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_users_limit integer;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS rut text;
    
    ALTER TABLE public.companies ALTER COLUMN payment_instructions SET DEFAULT 'Transferir a Banco Estado, Cuenta Corriente N° 123456789. Enviar comprobante a pagos@lukeapp.cl';

    -- Table: projects
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_primary_url text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_secondary_url text;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_primary_crop jsonb;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_secondary_crop jsonb;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS split_suffix_strategy text DEFAULT 'ALPHABETIC';

    -- Table: spools
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS spool_number text;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS status text;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS total_welds integer;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS shop_welds integer;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS field_welds integer;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS total_inches numeric;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS current_location_id uuid;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS location_updated_by uuid REFERENCES public.users(id);
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS tag_registry_id uuid;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS management_tag text;
    ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS split_from_weld_id uuid;

    -- Table: spools_welds
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS material text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS thickness text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS nps text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS sch text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS weld_location text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS execution_status text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS executed_at timestamptz;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS executed_by uuid REFERENCES public.users(id);
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS welder_stamp text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS execution_notes text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS photo_url text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS support_welder_id text;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS diameter_inches numeric;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS display_order integer;
    ALTER TABLE public.spools_welds ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

    -- Table: engineering_revisions
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS rev_code text;
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS revision_status text DEFAULT 'PENDING';
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS transmittal_code text;
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS transmittal_date date;
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS release_date date DEFAULT CURRENT_DATE;
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS has_production_data boolean DEFAULT false;
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS spools_loaded boolean DEFAULT false;
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS welds_loaded boolean DEFAULT false;
    ALTER TABLE public.engineering_revisions ADD COLUMN IF NOT EXISTS mto_loaded boolean DEFAULT false;

    -- Table: users
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

    ---------------------------------------------------------
    -- 3. NEW TABLES
    ---------------------------------------------------------

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_locations') THEN
        CREATE TABLE public.project_locations (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id uuid NOT NULL REFERENCES public.projects(id),
            name text NOT NULL,
            description text,
            is_active boolean DEFAULT true,
            created_at timestamptz DEFAULT now(),
            created_by uuid REFERENCES public.users(id),
            updated_at timestamptz DEFAULT now(),
            updated_by uuid REFERENCES public.users(id)
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'joint_status_history') THEN
        CREATE TABLE public.joint_status_history (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            joint_id uuid NOT NULL,
            previous_status text,
            new_status text NOT NULL,
            changed_at timestamptz NOT NULL DEFAULT now(),
            changed_by uuid REFERENCES public.users(id),
            comments text,
            project_id uuid REFERENCES public.projects(id),
            company_id uuid REFERENCES public.companies(id)
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_notifications') THEN
        CREATE TABLE public.system_notifications (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid NOT NULL REFERENCES public.companies(id),
            type text NOT NULL,
            strike_count integer NOT NULL,
            data jsonb DEFAULT '{}',
            is_sent boolean DEFAULT false,
            created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quota_strikes') THEN
        CREATE TABLE public.quota_strikes (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id uuid NOT NULL REFERENCES public.companies(id),
            quota_type text NOT NULL,
            current_value integer NOT NULL,
            limit_value integer NOT NULL,
            notification_sent boolean DEFAULT false,
            last_strike_at timestamptz DEFAULT now()
        );
    END IF;

    RAISE NOTICE '✅ Mega Sync Completed successfully!';

END $$;
