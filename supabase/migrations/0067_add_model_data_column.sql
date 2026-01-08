-- Add model_data JSONB column to engineering_revisions
ALTER TABLE public.engineering_revisions
ADD COLUMN IF NOT EXISTS model_data JSONB DEFAULT '{}'::jsonb;

-- Comment on column for clarity
COMMENT ON COLUMN public.engineering_revisions.model_data IS 'Almacena metadatos del modelo 3D, incluyendo mapeo de mesh->spool y configuracion de camara';
