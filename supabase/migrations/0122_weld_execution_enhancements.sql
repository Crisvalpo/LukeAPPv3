-- Migration 0122: Weld Execution Enhancements
-- Description: Adds columns for support welder, diameter inches, and revision snapshot. Creates history table.

-- 1. Add new columns to spools_welds
ALTER TABLE public.spools_welds
ADD COLUMN IF NOT EXISTS support_welder_id TEXT,
ADD COLUMN IF NOT EXISTS diameter_inches NUMERIC,
ADD COLUMN IF NOT EXISTS executed_revision_id UUID REFERENCES public.engineering_revisions(id);

-- 2. Create weld_status_history table
CREATE TABLE IF NOT EXISTS public.weld_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weld_id UUID NOT NULL REFERENCES public.spools_welds(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    comments TEXT, -- For rework reasons, error types, or general notes
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible field for extra data if needed
    
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_weld_history_weld ON public.weld_status_history(weld_id);
CREATE INDEX IF NOT EXISTS idx_weld_history_project ON public.weld_status_history(project_id);

-- 4. Enable RLS
ALTER TABLE public.weld_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view weld history" ON public.weld_status_history;
DROP POLICY IF EXISTS "Users can insert weld history" ON public.weld_status_history;

-- Create Policies
CREATE POLICY "Users can view weld history"
    ON public.weld_status_history FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.companies_projects WHERE company_id IN (
                SELECT company_id FROM public.members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert weld history"
    ON public.weld_status_history FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.companies_projects WHERE company_id IN (
                SELECT company_id FROM public.members WHERE user_id = auth.uid()
            )
        )
    );

SELECT 'Migration 0122 complete' as status;
