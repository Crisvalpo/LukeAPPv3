-- Migration 0034: Force Schema Refresh
-- Adds a dummy column to force PostgREST to refresh its schema cache for spools_joints
-- Then drops it immediately.

ALTER TABLE public.spools_joints ADD COLUMN IF NOT EXISTS _force_refresh TEXT;
ALTER TABLE public.spools_joints DROP COLUMN IF EXISTS _force_refresh;

-- Re-apply the column rename just in case it was missed, though previous migration should have handled it.
-- This is idempotent.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spools_joints' AND column_name = 'joint_number') THEN
    ALTER TABLE public.spools_joints RENAME COLUMN joint_number TO flanged_joint_number;
  END IF;
END $$;
