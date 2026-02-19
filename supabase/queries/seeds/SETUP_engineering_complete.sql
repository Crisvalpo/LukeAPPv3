-- ============================================
-- SETUP COMPLETO: Engineering Module
-- Base de datos: bzjxkraxkhsrflwthiqv
-- Ejecutar en: SQL Editor de Supabase
-- ============================================

-- 1. Crear tabla isometrics (requerida por engineering_revisions)
CREATE TABLE IF NOT EXISTS isometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  iso_number TEXT NOT NULL,
  current_revision_id UUID,
  revision TEXT,
  status TEXT DEFAULT 'VIGENTE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, iso_number)
);

-- 2. Crear tabla engineering_revisions
CREATE TABLE IF NOT EXISTS engineering_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  isometric_id UUID NOT NULL REFERENCES isometrics(id) ON DELETE CASCADE,
  rev_code TEXT NOT NULL,
  revision_status TEXT DEFAULT 'VIGENTE',
  transmittal TEXT,
  announcement_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(isometric_id, rev_code)
);

-- 3. Crear tabla spools_welds (para los detalles de ingeniería)
CREATE TABLE IF NOT EXISTS spools_welds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES engineering_revisions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  spool_number TEXT NOT NULL,
  weld_id TEXT NOT NULL,
  diameter NUMERIC,
  spec TEXT,
  heat_number TEXT,
  thickness TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(revision_id, weld_id)
);

-- 4. Habilitar RLS en todas las tablas
ALTER TABLE isometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spools_welds ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS eng_rev_company_isolation ON engineering_revisions;
DROP POLICY IF EXISTS "Users can view revisions from their companies" ON engineering_revisions;
DROP POLICY IF EXISTS "Users can insert revisions to their companies" ON engineering_revisions;
DROP POLICY IF EXISTS "Users can update revisions from their companies" ON engineering_revisions;

DROP POLICY IF EXISTS isometrics_company_access ON isometrics;
DROP POLICY IF EXISTS spools_welds_company_access ON spools_welds;

-- 6. Crear políticas RLS para engineering_revisions
CREATE POLICY engineering_revisions_company_access 
ON engineering_revisions
FOR ALL
USING (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid()
  )
);

-- 7. Crear políticas RLS para isometrics
CREATE POLICY isometrics_company_access 
ON isometrics
FOR ALL
USING (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid()
  )
);

-- 8. Crear políticas RLS para spools_welds
CREATE POLICY spools_welds_company_access 
ON spools_welds
FOR ALL
USING (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM members 
    WHERE user_id = auth.uid()
  )
);

-- 9. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_isometrics_project ON isometrics(project_id);
CREATE INDEX IF NOT EXISTS idx_isometrics_company ON isometrics(company_id);
CREATE INDEX IF NOT EXISTS idx_eng_revisions_project ON engineering_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_eng_revisions_company ON engineering_revisions(company_id);
CREATE INDEX IF NOT EXISTS idx_eng_revisions_isometric ON engineering_revisions(isometric_id);
CREATE INDEX IF NOT EXISTS idx_spools_welds_revision ON spools_welds(revision_id);
CREATE INDEX IF NOT EXISTS idx_spools_welds_company ON spools_welds(company_id);

-- 10. Verificar que todo se creó correctamente
SELECT 
  'Tables Created' as status,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('isometrics', 'engineering_revisions', 'spools_welds');

-- Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename IN ('isometrics', 'engineering_revisions', 'spools_welds')
ORDER BY tablename, policyname;
