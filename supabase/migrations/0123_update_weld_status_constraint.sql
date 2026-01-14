-- Migration 0123: Update Weld Status Constraint
-- Description: Updates the check constraint on spools_welds.execution_status to allow new statuses (EXECUTED, REWORK, DELETED).

-- 1. Drop existing constraint
ALTER TABLE public.spools_welds
DROP CONSTRAINT IF EXISTS spools_welds_execution_status_check;

-- 2. Add new constraint with expanded values
-- Preserving old values (IN_PROGRESS, COMPLETED, REJECTED) for backward compatibility
-- Adding new values (EXECUTED, REWORK, DELETED)
ALTER TABLE public.spools_welds
ADD CONSTRAINT spools_welds_execution_status_check 
CHECK (execution_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXECUTED', 'REWORK', 'DELETED'));

SELECT 'Migration 0123 complete: execution_status constraint updated' as status;
