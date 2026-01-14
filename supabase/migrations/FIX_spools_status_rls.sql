-- FIX Spool RLS policies and Status Constraint
-- Description:
-- 1. Adds 'FABRICATED' to the allowed spool statuses.
-- 2. Refreshes RLS policies for spools to ensure Owners/Members can UPDATE.

-- 1. Disable RLS temporarily to avoid locking issues (optional, but safer for migration)
ALTER TABLE public.spools DISABLE ROW LEVEL SECURITY;

-- 2. Update Check Constraint to include FABRICATED
ALTER TABLE public.spools DROP CONSTRAINT IF EXISTS spools_status_check;

ALTER TABLE public.spools
    ADD CONSTRAINT spools_status_check 
    CHECK (status IN ('PENDING', 'IN_FABRICATION', 'FABRICATED', 'COMPLETED', 'PAINTING', 'SHIPPED', 'DELIVERED', 'INSTALLED'));

-- 3. Re-Enable RLS and Fix Policies
ALTER TABLE public.spools ENABLE ROW LEVEL SECURITY;

-- Drop old policies to be clean
DROP POLICY IF EXISTS "Users can view spools" ON public.spools;
DROP POLICY IF EXISTS "Users can manage spools" ON public.spools;
DROP POLICY IF EXISTS "Users can update spools" ON public.spools;

-- Re-create Policies using clean company_id check
CREATE POLICY "Users can view spools" ON public.spools
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE user_id = auth.uid() 
            AND company_id = spools.company_id
        )
    );

CREATE POLICY "Users can manage spools" ON public.spools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE user_id = auth.uid() 
            AND company_id = spools.company_id
        )
    );

COMMENT ON COLUMN public.spools.status IS 'PENDING, IN_FABRICATION, FABRICATED, COMPLETED, PAINTING, SHIPPED, DELIVERED, INSTALLED';
