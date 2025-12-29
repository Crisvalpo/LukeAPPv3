-- Migration to add requires_joints flag to engineering_revisions
ALTER TABLE engineering_revisions ADD COLUMN requires_joints BOOLEAN DEFAULT NULL;
