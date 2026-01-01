-- 🔎 Verification Script: Spool Tags Inspection
-- Run this in your Supabase SQL Editor to see the results of the auto-tagging.

-- 1. Summary Statistics
SELECT 
    'Spool Tags Summary' as check_name,
    count(*) as total_tags,
    count(*) filter (where status = 'ACTIVE') as active_tags,
    count(*) filter (where status = 'OBSOLETE') as obsolete_tags,
    count(*) filter (where status = 'SPLIT') as split_tags,
    count(*) filter (where status = 'MERGED') as merged_tags
FROM spool_tags_registry;

-- 2. Detailed View of Generated Tags (First 20)
-- Shows the new "Management Tag" (00001) alongside the original Spool Number (SP-01)
-- and where it was first created vs last seen.
SELECT 
    str.tag_display as "TAG",
    str.status as "ESTADO",
    str.current_spool_number as "SPOOL_ACTUAL",
    i.iso_number as "ISOMETRICO",
    er_created.rev_code as "REV_NACIMIENTO",
    er_last.rev_code as "REV_ACTUAL",
    str.notes as "NOTAS"
FROM spool_tags_registry str
JOIN isometrics i ON str.isometric_id = i.id
LEFT JOIN engineering_revisions er_created ON str.created_in_revision_id = er_created.id
LEFT JOIN engineering_revisions er_last ON str.last_seen_revision_id = er_last.id
ORDER BY str.tag_number ASC
LIMIT 20;

-- 3. Verify Links in Spools Table
-- Ensures the spools table is correctly pointing to the registry
SELECT 
    count(*) as spools_linked,
    count(*) filter (where tag_registry_id IS NULL) as spools_missing_link
FROM spools;
