-- Evolution: Areas and Work Fronts (AWP Alignment)

-- 1. Areas (CWA - Construction Work Area)
CREATE TABLE IF NOT EXISTS public.areas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(project_id, code)
);

-- 2. Work Fronts (IWP - Installation Work Package)
CREATE TABLE IF NOT EXISTS public.work_fronts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    status text DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')),
    priority integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(area_id, code)
);

-- RLS for Areas
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Areas are viewable by project members') THEN
        CREATE POLICY "Areas are viewable by project members" 
        ON public.areas FOR SELECT 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.members 
                WHERE public.members.project_id = public.areas.project_id 
                AND public.members.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- RLS for Work Fronts
ALTER TABLE public.work_fronts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Work fronts are viewable by project members') THEN
        CREATE POLICY "Work fronts are viewable by project members" 
        ON public.work_fronts FOR SELECT 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.members 
                WHERE public.members.project_id = public.work_fronts.project_id 
                AND public.members.user_id = auth.uid()
            )
        );
    END IF;
END $$;
