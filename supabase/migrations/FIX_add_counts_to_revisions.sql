-- Migration: Add count columns to engineering_revisions
-- Purpose: Store aggregated counts of spools and welds for each revision
-- This fixes the Master View displaying 0 for counts

-- Add count columns
ALTER TABLE engineering_revisions
  ADD COLUMN IF NOT EXISTS welds_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spools_count INTEGER DEFAULT 0;

-- Function to update counts for a revision
CREATE OR REPLACE FUNCTION update_revision_counts()
RETURNS TRIGGER AS $$
DECLARE
  rev_id UUID;
BEGIN
  -- Get revision_id from the affected row
  rev_id := COALESCE(NEW.revision_id, OLD.revision_id);
  
  IF rev_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Update welds count
  UPDATE engineering_revisions
  SET welds_count = (
    SELECT COUNT(*)
    FROM spools_welds
    WHERE revision_id = rev_id
  )
  WHERE id = rev_id;
  
  -- Update spools count
  UPDATE engineering_revisions
  SET spools_count = (
    SELECT COUNT(DISTINCT spool_number)
    FROM spools_welds
    WHERE revision_id = rev_id
  )
  WHERE id = rev_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on spools_welds to auto-update counts
DROP TRIGGER IF EXISTS update_revision_counts_on_welds ON spools_welds;
CREATE TRIGGER update_revision_counts_on_welds
  AFTER INSERT OR UPDATE OR DELETE ON spools_welds
  FOR EACH ROW
  EXECUTE FUNCTION update_revision_counts();

-- Backfill existing data
UPDATE engineering_revisions er
SET 
  welds_count = (
    SELECT COUNT(*)
    FROM spools_welds sw
    WHERE sw.revision_id = er.id
  ),
  spools_count = (
    SELECT COUNT(DISTINCT spool_number)
    FROM spools_welds sw
    WHERE sw.revision_id = er.id
  );
