-- Migration 0084: Reboot Personnel Management
-- Tables: project_personnel, work_schedules
-- RLS: Optimized for Admins/Supervisors (Project Level) AND Founders (Company Level)

-- 1. Work Schedules Table
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Project Personnel Table
CREATE TABLE IF NOT EXISTS public.project_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    rut TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role_tag TEXT NOT NULL, -- 'SOLDADOR', 'CAPATAZ', etc.
    active BOOLEAN DEFAULT true,
    work_schedule_id UUID REFERENCES public.work_schedules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: Unique RUT per project
    CONSTRAINT uq_project_personnel_rut UNIQUE (project_id, rut)
);

-- Enable RLS
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_personnel ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS POLICIES: work_schedules
-- =========================================================================

-- SELECT: Visible for all project members
CREATE POLICY "View work_schedules" ON public.work_schedules
    FOR SELECT USING (
        -- Project Members
        project_id IN (
            SELECT project_id FROM public.members WHERE user_id = auth.uid()
        )
        OR
        -- Company Founders/Admins (Company Level)
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.projects p ON p.company_id = m.company_id
            WHERE m.user_id = auth.uid()
            AND m.role_id IN ('founder', 'super_admin')
            AND m.project_id IS NULL -- Company level membership
            AND p.id = work_schedules.project_id
        )
    );

-- MANAGE (Insert, Update, Delete): Admins & Supervisors of the project + Company Founders
CREATE POLICY "Manage work_schedules" ON public.work_schedules
    FOR ALL USING (
        -- Project Admin/Supervisor
        project_id IN (
            SELECT project_id FROM public.members 
            WHERE user_id = auth.uid() 
            AND role_id IN ('admin', 'supervisor')
        )
        OR
        -- Company Founders
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.projects p ON p.company_id = m.company_id
            WHERE m.user_id = auth.uid()
            AND m.role_id IN ('founder', 'super_admin')
            AND m.project_id IS NULL
            AND p.id = work_schedules.project_id
        )
    );

-- =========================================================================
-- RLS POLICIES: project_personnel
-- =========================================================================

-- SELECT: Visible for all project members
CREATE POLICY "View project_personnel" ON public.project_personnel
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.members WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.projects p ON p.company_id = m.company_id
            WHERE m.user_id = auth.uid()
            AND m.role_id IN ('founder', 'super_admin')
            AND m.project_id IS NULL
            AND p.id = project_personnel.project_id
        )
    );

-- MANAGE (Insert, Update, Delete): Admins & Supervisors + Company Founders
CREATE POLICY "Manage project_personnel" ON public.project_personnel
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.members 
            WHERE user_id = auth.uid() 
            AND role_id IN ('admin', 'supervisor')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.projects p ON p.company_id = m.company_id
            WHERE m.user_id = auth.uid()
            AND m.role_id IN ('founder', 'super_admin')
            AND m.project_id IS NULL
            AND p.id = project_personnel.project_id
        )
    );
