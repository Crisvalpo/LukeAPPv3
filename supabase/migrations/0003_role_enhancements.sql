-- Migration 0003: Role Enhancements (Dual-Key Identity & Additive Permissions)

-- 1. Create table for Custom Role Labels (Tenant Specific)
CREATE TABLE IF NOT EXISTS public.roles_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role_key TEXT NOT NULL, -- 'admin', 'supervisor', 'operator'
    custom_label TEXT NOT NULL, -- 'Jefe de Terreno', 'Pañolero'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, role_key)
);

-- Enable RLS
ALTER TABLE public.roles_config ENABLE ROW LEVEL SECURITY;

-- 2. Add Permissions column to Project Members (Additive Capabilities)
-- Check which table exists (legacy members vs new project_members) and adapt
DO $$
BEGIN
    -- Check for 'project_members' (New Standard)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_members') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'permissions') THEN
            ALTER TABLE public.project_members ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
        END IF;
    -- Fallback to 'members' (Legacy 0000)
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'permissions') THEN
            ALTER TABLE public.members ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
        END IF;
    END IF;
END $$;

-- 3. Update or Create Helper View for UI
-- This view joins the member's system role with the project's custom label config
-- Returns: user_id, project_id, role_key (system), role_label (display), permissions

CREATE OR REPLACE VIEW public.enriched_user_roles AS
SELECT 
    pm.user_id,
    pm.project_id,
    pm.role as role_key, -- The immutable system role
    COALESCE(rc.custom_label, pm.role) as role_label, -- The display label (fallback to system key)
    pm.permissions -- The additive capabilities
FROM public.project_members pm
LEFT JOIN public.roles_config rc ON pm.project_id = rc.project_id AND pm.role = rc.role_key;

-- 4. RLS Policies for roles_config

-- Users can read config of their own projects
CREATE POLICY "Users can view role config of their projects" ON public.roles_config
    FOR SELECT USING (project_id IN (
        SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    ));

-- Only Project Admins/Founders can edit role config
CREATE POLICY "Admins can manage role config" ON public.roles_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE user_id = auth.uid() 
            AND project_id = roles_config.project_id 
            AND role IN ('founder', 'admin')
        )
    );

-- Grant access
GRANT SELECT ON public.enriched_user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles_config TO authenticated;
