-- Migration 0033: Cleanup Unused Tables
-- Removes tables that were proposed but rejected or are obsolete

-- 1. Drop 'bolted_joints' if it exists (User proposed schema that was rejected in favor of spools_joints)
DROP TABLE IF EXISTS public.bolted_joints;

-- 2. Verify 'welds' is gone (Legacy table replaced by spools_welds in Migration 0025)
DROP TABLE IF EXISTS public.welds;

-- 3. Verify 'spools' (Legacy version) - WAIT, we RESTORED spools in 0031. Do NOT drop 'spools'.
-- spools table is NOW ACTIVE and required for MTO/Tracking.

-- 4. Verify 'material_takeoff' (Legacy name if any? No, we used spools_mto)
-- Just clean strictly known unused ones.
