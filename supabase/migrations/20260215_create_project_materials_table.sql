-- Migration: Create project_materials table
-- Description: Capa de filtrado entre librería global (master_catalog) y catálogo project-scoped
-- Author: LukeAPP v3
-- Date: 2026-02-15

-- =====================================================
-- TABLA: project_materials
-- =====================================================
-- Propósito: Materiales USADOS en un proyecto específico
-- Vinculación: master_catalog (invisible) → project_materials (visible para usuario)

CREATE TABLE IF NOT EXISTS project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Vinculación con librería global (invisible para usuario)
  master_id uuid NOT NULL REFERENCES master_catalog(id) ON DELETE RESTRICT,
  dimension_id uuid NOT NULL REFERENCES master_dimensions(id) ON DELETE RESTRICT,
  
  -- Metadata del proyecto
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  total_quantity_used numeric NOT NULL DEFAULT 0,
  
  -- Campos personalizados del proyecto (opcional)
  project_item_code text,           -- Código interno del proyecto
  project_notes text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_project_dimension UNIQUE(project_id, dimension_id),
  CONSTRAINT positive_quantity CHECK (total_quantity_used >= 0)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_project_materials_project 
  ON project_materials(project_id);

CREATE INDEX IF NOT EXISTS idx_project_materials_master 
  ON project_materials(master_id);

CREATE INDEX IF NOT EXISTS idx_project_materials_dimension 
  ON project_materials(dimension_id);

CREATE INDEX IF NOT EXISTS idx_project_materials_company 
  ON project_materials(company_id);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_project_materials_project_master 
  ON project_materials(project_id, master_id);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE project_materials IS 
  'Catálogo de materiales filtrado por proyecto. Solo muestra materiales USADOS en el proyecto específico.';

COMMENT ON COLUMN project_materials.master_id IS 
  'Referencia a master_catalog (librería global invisible)';

COMMENT ON COLUMN project_materials.dimension_id IS 
  'Referencia a master_dimensions (especificación exacta: NPS, Schedule, etc.)';

COMMENT ON COLUMN project_materials.total_quantity_used IS 
  'Cantidad total usada en el proyecto (suma de todas las apariciones en project_mto y spools_mto)';

COMMENT ON COLUMN project_materials.project_item_code IS 
  'Código interno del proyecto para este material (opcional)';

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Ver materiales del proyecto si tienes acceso al proyecto
CREATE POLICY "Users can view project materials if they have project access"
  ON project_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_materials.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Policy: INSERT - Solo via triggers (no inserciones manuales)
-- Los materiales se agregan automáticamente desde project_mto y spools_mto

-- Policy: UPDATE - Solo admins del proyecto pueden editar notas/códigos personalizados
CREATE POLICY "Project admins can update custom fields"
  ON project_materials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_materials.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('ADMIN', 'OWNER')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_materials.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('ADMIN', 'OWNER')
    )
  );

-- Policy: DELETE - Solo owners del proyecto
CREATE POLICY "Project owners can delete materials"
  ON project_materials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_materials.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'OWNER'
    )
  );
