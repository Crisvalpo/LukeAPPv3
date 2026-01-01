-- CLEANUP SCRIPT: Engineering Module (FINAL NO-ANNOUNCEMENTS)
-- Description: Deletes ALL engineering data (Isometrics, Revisions, Details) to allow a fresh start.
-- Update: Fixed Circular FK and Removed non-existent table deletion

BEGIN;

-- 0. Break Circular Dependency
-- Isometrics point to a "current revision", and revisions point to an isometric.
-- We must clear the pointer from parent to child first.
UPDATE isometrics SET current_revision_id = NULL;

-- 1. Delete Details (Children of Engineering Revisions)
DELETE FROM spools_welds;    
DELETE FROM spools_mto;      
DELETE FROM spools_joints;   
DELETE FROM spool_tags_registry; -- Fix: Remove references to revisions/spools
DELETE FROM spools;

-- 2. Delete Revision Logic
DELETE FROM engineering_revisions;

-- 3. Delete Parent Isometrics
DELETE FROM isometrics;

-- 4. Delete Logs & History
DELETE FROM revision_events;
DELETE FROM revision_impacts;

-- 5. No separate announcements table to delete
-- (Announcement data is stored within isometrics/revisions columns as per Mig 0017)

COMMIT;

-- Verification
SELECT 
  (SELECT count(*) FROM isometrics) as iso_count,
  (SELECT count(*) FROM engineering_revisions) as rev_count,
  (SELECT count(*) FROM spools) as spool_count,
  (SELECT count(*) FROM spools_welds) as welds_count;
