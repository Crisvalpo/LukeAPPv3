-- Simple Engineering Revisions Migration
-- Execute this in Supabase SQL Editor directly

-- 1. Create table
CREATE TABLE IF NOT EXISTS engineering_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isometric_id UUID NOT NULL,
  project_id UUID NOT NULL,
  rev_code TEXT NOT NULL,
  revision_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(isometric_id, rev_code)
);

-- 2. Add FK constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_eng_rev_isometric') THEN
    ALTER TABLE engineering_revisions
      ADD CONSTRAINT fk_eng_rev_isometric
      FOREIGN KEY (isometric_id) REFERENCES isometrics(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_eng_rev_project') THEN
    ALTER TABLE engineering_revisions
      ADD CONSTRAINT fk_eng_rev_project
      FOREIGN KEY (project_id) REFERENCES projects(id);
  END IF;
END$$;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_eng_rev_isometric ON engineering_revisions(isometric_id);
CREATE INDEX IF NOT EXISTS idx_eng_rev_project ON engineering_revisions(project_id);

-- 4. Migrate existing data
INSERT INTO engineering_revisions (isometric_id, project_id, rev_code)
SELECT id, project_id, COALESCE(revision, 'A')
FROM isometrics
WHERE NOT EXISTS (
  SELECT 1 FROM engineering_revisions er WHERE er.isometric_id = isometrics.id
);

-- 5. Add current_revision_id to isometrics
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS current_revision_id UUID;

-- 6. Update current_revision_id
UPDATE isometrics SET current_revision_id = (
  SELECT id FROM engineering_revisions 
  WHERE isometric_id = isometrics.id 
  LIMIT 1
) WHERE current_revision_id IS NULL;

-- 7. Add revision_id to spools
ALTER TABLE spools ADD COLUMN IF NOT EXISTS revision_id UUID;

UPDATE spools SET revision_id = (
  SELECT er.id FROM engineering_revisions er
  INNER JOIN isometrics i ON i.id = er.isometric_id
  WHERE i.iso_number = spools.iso_number
  LIMIT 1
) WHERE revision_id IS NULL;

-- 8. Add revision_id to welds
ALTER TABLE welds ADD COLUMN IF NOT EXISTS revision_id UUID;

UPDATE welds SET revision_id = (
  SELECT s.revision_id FROM spools s
  WHERE s.spool_number = welds.spool_number
  LIMIT 1
) WHERE revision_id IS NULL;

-- 9. Create MTO table
CREATE TABLE IF NOT EXISTS material_take_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_id UUID NOT NULL,
  project_id UUID NOT NULL,
  item_code TEXT NOT NULL,
  qty DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(revision_id, item_code)
);

-- 10. Create bolted_joints table
CREATE TABLE IF NOT EXISTS bolted_joints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_id UUID NOT NULL,
  project_id UUID NOT NULL,
  flanged_joint_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(revision_id, flanged_joint_number)
);

-- 11. Enable RLS
ALTER TABLE engineering_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_take_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolted_joints ENABLE ROW LEVEL SECURITY;

-- 12. Create basic RLS policies
DROP POLICY IF EXISTS eng_rev_select ON engineering_revisions;
CREATE POLICY eng_rev_select ON engineering_revisions FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS mto_select ON material_take_off;
CREATE POLICY mto_select ON material_take_off FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS bolted_select ON bolted_joints;
CREATE POLICY bolted_select ON bolted_joints FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN members m ON m.company_id = p.company_id
    WHERE m.user_id = auth.uid()
  )
);

-- DONE!
SELECT 'Migration 0016b completed successfully!' as status;
