ALTER TABLE project_personnel 
ADD COLUMN IF NOT EXISTS internal_id TEXT,
ADD COLUMN IF NOT EXISTS shift_type TEXT CHECK (shift_type IN ('DIA', 'NOCHE'));

COMMENT ON COLUMN project_personnel.internal_id IS 'Identifier used by the company (ficha, codigo, etc)';
COMMENT ON COLUMN project_personnel.shift_type IS 'Work shift type: DIA or NOCHE';
