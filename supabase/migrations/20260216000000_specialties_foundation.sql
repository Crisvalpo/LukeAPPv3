-- Evolution: Specialties and Project Specialties
CREATE TABLE IF NOT EXISTS public.specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    code text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Insert default specialties
INSERT INTO public.specialties (name, code, description) VALUES
('Piping', 'PIP', 'Sistemas de tuberías industriales'),
('Structural', 'STR', 'Estructuras metálicas y hormigón'),
('Electrical', 'ELE', 'Sistemas eléctricos y bandejas'),
('Instrumentation', 'INS', 'Instrumentación y control'),
('Mechanical', 'MEC', 'Equipos mecánicos y montaje')
ON CONFLICT (code) DO NOTHING;

-- Create project_specialties join table
CREATE TABLE IF NOT EXISTS public.project_specialties (
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    specialty_id uuid REFERENCES public.specialties(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (project_id, specialty_id)
);

-- RLS for specialties
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Specialties are viewable by all authenticated users') THEN
        CREATE POLICY "Specialties are viewable by all authenticated users" 
        ON public.specialties FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- RLS for project_specialties
ALTER TABLE public.project_specialties ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Project specialties are viewable by project members') THEN
        CREATE POLICY "Project specialties are viewable by project members" 
        ON public.project_specialties FOR SELECT 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.members 
                WHERE public.members.project_id = public.project_specialties.project_id 
                AND public.members.user_id = auth.uid()
            )
        );
    END IF;
END $$;
