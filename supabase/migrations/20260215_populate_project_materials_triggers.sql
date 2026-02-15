-- Migration: Create function to populate project_materials
-- Description: Función que auto-puebla project_materials desde project_mto y spools_mto
-- Author: LukeAPP v3
-- Date: 2026-02-15

-- =====================================================
-- FUNCIÓN: fn_populate_project_materials()
-- =====================================================
-- Propósito: Agregar materiales a project_materials automáticamente
-- Trigger: Se ejecuta AFTER INSERT OR UPDATE en project_mto y spools_mto

CREATE OR REPLACE FUNCTION fn_populate_project_materials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_master_id uuid;
  v_company_id uuid;
BEGIN
  -- Validar que tenemos dimension_id
  IF NEW.dimension_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener master_id desde dimension
  SELECT master_id INTO v_master_id
  FROM master_dimensions
  WHERE id = NEW.dimension_id;
  
  -- Si no encontramos master_id, salir
  IF v_master_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener company_id desde project
  SELECT company_id INTO v_company_id
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Insertar o actualizar en project_materials
  INSERT INTO project_materials (
    project_id,
    company_id,
    master_id,
    dimension_id,
    total_quantity_used,
    first_seen_at,
    last_used_at
  )
  VALUES (
    NEW.project_id,
    v_company_id,
    v_master_id,
    NEW.dimension_id,
    COALESCE(NEW.quantity, NEW.qty, 0),  -- Soporta ambos nombres de columna
    now(),
    now()
  )
  ON CONFLICT (project_id, dimension_id) 
  DO UPDATE SET
    last_used_at = now(),
    total_quantity_used = project_materials.total_quantity_used + COALESCE(NEW.quantity, NEW.qty, 0),
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION fn_populate_project_materials() IS 
  'Auto-puebla project_materials cuando se inserta/actualiza en project_mto o spools_mto';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger en project_mto
DROP TRIGGER IF EXISTS trg_populate_project_materials_from_mto ON project_mto;

CREATE TRIGGER trg_populate_project_materials_from_mto
  AFTER INSERT OR UPDATE ON project_mto
  FOR EACH ROW
  EXECUTE FUNCTION fn_populate_project_materials();

-- Trigger en spools_mto
DROP TRIGGER IF EXISTS trg_populate_project_materials_from_spools ON spools_mto;

CREATE TRIGGER trg_populate_project_materials_from_spools
  AFTER INSERT OR UPDATE ON spools_mto
  FOR EACH ROW
  EXECUTE FUNCTION fn_populate_project_materials();

-- =====================================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- =====================================================

-- Poblar project_materials con datos existentes de project_mto
INSERT INTO project_materials (
  project_id,
  company_id,
  master_id,
  dimension_id,
  total_quantity_used,
  first_seen_at,
  last_used_at
)
SELECT DISTINCT
  pm.project_id,
  p.company_id,
  md.master_id,
  pm.dimension_id,
  SUM(pm.quantity) as total_quantity,
  MIN(pm.created_at) as first_seen,
  MAX(pm.updated_at) as last_used
FROM project_mto pm
JOIN projects p ON pm.project_id = p.id
JOIN master_dimensions md ON pm.dimension_id = md.id
WHERE pm.dimension_id IS NOT NULL
GROUP BY pm.project_id, p.company_id, md.master_id, pm.dimension_id
ON CONFLICT (project_id, dimension_id) DO NOTHING;

-- Poblar project_materials con datos existentes de spools_mto
INSERT INTO project_materials (
  project_id,
  company_id,
  master_id,
  dimension_id,
  total_quantity_used,
  first_seen_at,
  last_used_at
)
SELECT DISTINCT
  sm.project_id,
  p.company_id,
  md.master_id,
  sm.dimension_id,
  SUM(sm.qty) as total_quantity,
  MIN(sm.created_at) as first_seen,
  MAX(sm.updated_at) as last_used
FROM spools_mto sm
JOIN projects p ON sm.project_id = p.id
JOIN master_dimensions md ON sm.dimension_id = md.id
WHERE sm.dimension_id IS NOT NULL
GROUP BY sm.project_id, p.company_id, md.master_id, sm.dimension_id
ON CONFLICT (project_id, dimension_id) DO NOTHING;
