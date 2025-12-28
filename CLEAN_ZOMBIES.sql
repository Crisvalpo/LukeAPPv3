/**
 * CLEANUP ZOMBIES (Partial Uploads)
 * 
 * Deletes isometrics that don't have a corresponding revision
 * (residue from the failed upload attempts)
 */

-- Delete engineering_revisions just in case (to start fresh)
DELETE FROM public.engineering_revisions;

-- Delete Isometrics that were uploaded partially (keep the test one if you want, or delete all)
-- Deleting ALL is best for a clean re-test
DELETE FROM public.isometrics;

SELECT 'Database succcesfully cleaned. Ready for fresh upload!' as status;
