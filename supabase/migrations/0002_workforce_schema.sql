-- 1. Create Base Tables for Workforce Module (if not exist)
-- These tables are prerequisites for the view.

-- Schedules (Jornadas)
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- "5x2", "14x14"
    work_days INTEGER DEFAULT 5,
    rest_days INTEGER DEFAULT 2,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal (Workers)
CREATE TABLE IF NOT EXISTS public.personal (
    rut VARCHAR(20) PRIMARY KEY, -- Chilean RUT
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL, -- 'WELDER', 'FOREMAN', 'SUPERVISOR'
    labor_code TEXT,    -- Company ID Code
    stamp_code TEXT,    -- Welding Stamp (S-01)
    schedule_id UUID REFERENCES public.work_schedules(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Stamp only for welders (enforced via app logic mostly, but good to note)
    UNIQUE(project_id, labor_code)
);

-- Cuadrillas (Crews)
CREATE TABLE IF NOT EXISTS public.cuadrillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT DEFAULT 'PRINCIPAL', -- 'PRINCIPAL', 'SUPPORT'
    shift_type TEXT DEFAULT 'DAY', -- 'DAY', 'NIGHT'
    supervisor_rut VARCHAR(20) REFERENCES public.personal(rut),
    foreman_rut VARCHAR(20) REFERENCES public.personal(rut),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Assignments (Asignaciones)
CREATE TABLE IF NOT EXISTS public.cuadrilla_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuadrilla_id UUID NOT NULL REFERENCES public.cuadrillas(id) ON DELETE CASCADE,
    worker_rut VARCHAR(20) NOT NULL REFERENCES public.personal(rut),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    role TEXT, -- 'WELDER', 'HELPER'
    active BOOLEAN DEFAULT true, -- Soft delete for daily movements
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(worker_rut, date, active) -- Only one active assignment per day
);

-- Daily Attendance (Asistencia)
CREATE TABLE IF NOT EXISTS public.daily_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_rut VARCHAR(20) NOT NULL REFERENCES public.personal(rut),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL, -- 'PRESENT', 'ABSENT', 'LICENCE'
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(worker_rut, date)
);

-- 2. Create the Comprehensive View
-- This view powers the UI lists by joining all relevant state.

CREATE OR REPLACE VIEW public.view_personal_with_schedule AS
SELECT 
    p.rut,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.role,
    p.labor_code,
    p.stamp_code,
    p.active,
    p.project_id,
    
    -- Schedule Info
    ws.id as schedule_id,
    ws.name as schedule_name,
    
    -- Assignment Status (Is currently in a crew?)
    COALESCE(ca.active, false) as is_assigned,
    c.id as assigned_crew_id,
    c.name as assigned_crew_name,
    c.code as assigned_crew_code,
    
    -- Attendance Status (Today)
    da.status as attendance_status, -- PRESENT, ABSENT
    
    -- Computed Fields
    (p.first_name || ' ' || p.last_name) as full_name

FROM public.personal p
LEFT JOIN public.work_schedules ws ON p.schedule_id = ws.id
-- Join with ACTIVE assignment for TODAY (or latest active)
LEFT JOIN public.cuadrilla_assignments ca ON p.rut = ca.worker_rut AND ca.active = true AND ca.date = CURRENT_DATE
LEFT JOIN public.cuadrillas c ON ca.cuadrilla_id = c.id
-- Join with Attendance for TODAY
LEFT JOIN public.daily_attendance da ON p.rut = da.worker_rut AND da.date = CURRENT_DATE;

-- 3. Enable RLS on all new tables
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadrillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadrilla_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;

-- 4. Basic RLS Policies (Project Scoped)
-- Assumption: 'auth.uid()' maps to a user who has access to specific project_ids via 'project_members' table (from Phase 1).
-- For simplicity in this step, we'll auto-generate a helper function.

CREATE OR REPLACE FUNCTION public.get_user_projects()
RETURNS UUID[] AS $$
BEGIN
  -- Returns array of project_ids the current user is a member of
  RETURN ARRAY(
    SELECT project_id 
    FROM public.project_members 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Select Policies
CREATE POLICY "Users can view schedules of their projects" ON public.work_schedules
    FOR SELECT USING (project_id = ANY(public.get_user_projects()));

CREATE POLICY "Users can view personal of their projects" ON public.personal
    FOR SELECT USING (project_id = ANY(public.get_user_projects()));

CREATE POLICY "Users can view crew data of their projects" ON public.cuadrillas
    FOR SELECT USING (project_id = ANY(public.get_user_projects()));

CREATE POLICY "Users can view assignments of their projects" ON public.cuadrilla_assignments
    FOR SELECT USING (cuadrilla_id IN (SELECT id FROM public.cuadrillas WHERE project_id = ANY(public.get_user_projects())));

CREATE POLICY "Users can view attendance of their projects" ON public.daily_attendance
    FOR SELECT USING (project_id = ANY(public.get_user_projects()));

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.view_personal_with_schedule TO authenticated;
