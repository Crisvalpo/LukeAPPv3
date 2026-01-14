-- Add status columns to spools_joints
ALTER TABLE public.spools_joints
ADD COLUMN IF NOT EXISTS execution_status text DEFAULT 'PENDING' CHECK (execution_status IN ('PENDING', 'EXECUTED', 'REWORK', 'DELETED')),
ADD COLUMN IF NOT EXISTS executed_at timestamptz,
ADD COLUMN IF NOT EXISTS execution_notes text;

-- Create joint_status_history table
CREATE TABLE IF NOT EXISTS public.joint_status_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    joint_id uuid REFERENCES public.spools_joints(id) ON DELETE CASCADE NOT NULL,
    previous_status text,
    new_status text NOT NULL,
    changed_at timestamptz DEFAULT now() NOT NULL,
    changed_by uuid REFERENCES auth.users(id),
    comments text,
    project_id uuid REFERENCES public.projects(id)
);

-- Enable RLS
ALTER TABLE public.joint_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view joint history of their projects"
    ON public.joint_status_history FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert joint history for their projects"
    ON public.joint_status_history FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.members
            WHERE user_id = auth.uid()
        )
    );
