-- ULTRA SIMPLE Migration - With Cleanup
-- Run this in Supabase SQL Editor

-- 1. DROP existing table if corrupted
DROP TABLE IF EXISTS engineering_revisions CASCADE;
DROP TABLE IF EXISTS material_take_off CASCADE;
DROP TABLE IF EXISTS bolted_joints CASCADE;

-- 2. Create engineering_revisions (SIMPLE)
CREATE TABLE engineering_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isometric_id UUID NOT NULL,
  project_id UUID NOT NULL,
  rev_code TEXT NOT NULL,
  revision_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add FK AFTER table creation
ALTER TABLE engineering_revisions
  ADD CONSTRAINT fk_isometric 
  FOREIGN KEY (isometric_id) REFERENCES isometrics(id);

ALTER TABLE engineering_revisions
  ADD CONSTRAINT fk_project
  FOREIGN KEY (project_id) REFERENCES projects(id);

-- 4. Add unique constraint
ALTER TABLE engineering_revisions
  ADD CONSTRAINT uq_iso_rev UNIQUE(isometric_id, rev_code);

-- 5. Indexes
CREATE INDEX idx_eng_rev_iso ON engineering_revisions(isometric_id);
CREATE INDEX idx_eng_rev_proj ON engineering_revisions(project_id);

-- 6. Migrate data
INSERT INTO engineering_revisions (isometric_id, project_id, rev_code)
SELECT id, project_id, COALESCE(revision, 'A')
FROM isometrics;

-- 7. Add columns to existing tables
ALTER TABLE isometrics ADD COLUMN IF NOT EXISTS current_revision_id UUID;
ALTER TABLE spools ADD COLUMN IF NOT EXISTS revision_id UUID;
ALTER TABLE welds ADD COLUMN IF NOT EXISTS revision_id UUID;

-- 8. Update references
UPDATE isometrics SET current_revision_id = (
  SELECT id FROM engineering_revisions WHERE isometric_id = isometrics.id LIMIT 1
);

UPDATE spools SET revision_id = (
  SELECT er.id FROM engineering_revisions er
  INNER JOIN isometrics i ON i.id = er.isometric_id
  WHERE i.iso_number = spools.iso_number LIMIT 1
);

UPDATE welds SET revision_id = (
  SELECT s.revision_id FROM spools s WHERE s.spool_number = welds.spool_number LIMIT 1
);

-- 9. Create MTO table
CREATE TABLE material_take_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_id UUID NOT NULL REFERENCES engineering_revisions(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  item_code TEXT NOT NULL,
  qty DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create bolted_joints
CREATE TABLE bolted_joints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_id UUID NOT NULL REFERENCES engineering_revisions(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  flanged_joint_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. RLS
ALTER TABLE engineering_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_take_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolted_joints ENABLE ROW LEVEL SECURITY;

-- 12. Simple SELECT policies
CREATE POLICY eng_rev_policy ON engineering_revisions FOR SELECT USING (true);
CREATE POLICY mto_policy ON material_take_off FOR SELECT USING (true);
CREATE POLICY bolted_policy ON bolted_joints FOR SELECT USING (true);

-- SUCCESS!
SELECT 'Migration completed!' as status,
       COUNT(*) as revisions_created
FROM engineering_revisions;
