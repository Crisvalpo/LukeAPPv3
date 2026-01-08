-- Migration 0108: Fix Material Request Number Constraint
-- The original Unique constraint on request_number was global, causing conflicts between projects.
-- We change it to be unique per project.

-- 1. Drop the global unique constraint
ALTER TABLE material_requests 
DROP CONSTRAINT IF EXISTS material_requests_request_number_key;

-- 2. Add composite unique constraint (project_id + request_number)
ALTER TABLE material_requests 
ADD CONSTRAINT material_requests_project_number_key UNIQUE (project_id, request_number);
