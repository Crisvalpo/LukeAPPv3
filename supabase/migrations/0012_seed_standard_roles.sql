-- =====================================================
-- Seed: Standard Piping Roles (14 Templates)
-- Description: Inserts the 14 standard piping construction roles
-- Usage: Run this for each company OR clone via app
-- Author: LukeAPP Development Team
-- Date: 2025-12-26
-- =====================================================

-- This script provides a template INSERT statement that can be:
-- 1. Run manually with a specific company_id
-- 2. Called from application code via a function

-- ==========================================
-- HELPER FUNCTION: Clone Standard Roles
-- ==========================================

CREATE OR REPLACE FUNCTION public.clone_standard_piping_roles(target_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  roles_created integer := 0;
BEGIN
  -- Check if company exists
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = target_company_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Company not found'
    );
  END IF;

  -- Insert the 14 standard roles
  INSERT INTO public.company_roles (company_id, name, description, base_role, color, permissions, is_template)
  VALUES
    -- ═══════════════════════════════════════════════════════
    -- 👑 NIVEL ESTRATÉGICO (Management)
    -- ═══════════════════════════════════════════════════════
    (
      target_company_id,
      'Gerencia / Jefe Proyecto',
      'Visibilidad completa del proyecto. Dashboards financieros y de avance. Solo lectura y aprobaciones de alto nivel.',
      'supervisor',
      '#8b5cf6',
      '{
        "modules": {
          "dashboard": {"enabled": true, "is_home": true},
          "engineering": {"enabled": true, "is_home": false},
          "field": {"enabled": true, "is_home": false},
          "quality": {"enabled": true, "is_home": false},
          "warehouse": {"enabled": true, "is_home": false}
        },
        "resources": {
          "projects": {"view": true},
          "reports": {"view": true, "export": true},
          "kpis": {"view": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Cliente / ITO',
      'Inspector Técnico de Obra. Visibilidad completa. Aprobación/Rechazo de Protocolos y Test Packs.',
      'supervisor',
      '#f59e0b',
      '{
        "modules": {
          "quality": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false},
          "engineering": {"enabled": true, "is_home": false}
        },
        "resources": {
          "test_packs": {"view": true, "approve": true, "reject": true, "comment": true},
          "joints": {"view": true, "inspect": true},
          "spools": {"view": true},
          "reports": {"view": true, "export": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'P&C (Planificación)',
      'Control de Proyecto. Acceso a reportes de avance y curvas S. Comparación Programado vs Real.',
      'supervisor',
      '#3b82f6',
      '{
        "modules": {
          "dashboard": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false}
        },
        "resources": {
          "progress_reports": {"view": true, "export": true},
          "schedules": {"view": true, "edit": true},
          "curves": {"view": true}
        }
      }',
      true
    ),

    -- ═══════════════════════════════════════════════════════
    -- 🧠 NIVEL OFICINA TÉCNICA (Engineering)
    -- ═══════════════════════════════════════════════════════
    (
      target_company_id,
      'Jefe Oficina Técnica',
      'Control total de la ingeniería del proyecto. Carga masiva de datos y gestión de revisiones.',
      'admin',
      '#10b981',
      '{\r
        \"modules\": {\r
          \"engineering\": {\"enabled\": true, \"is_home\": true},\r
          \"revisiones\": {\"enabled\": true, \"is_home\": false},\r
          \"field\": {\"enabled\": true, \"is_home\": false},\r
          \"quality\": {\"enabled\": true, \"is_home\": false}\r
        },\r
        \"resources\": {\r
          \"lines\": {\"view\": true, \"create\": true, \"edit\": true, \"delete\": true},\r
          \"isometrics\": {\"view\": true, \"create\": true, \"edit\": true, \"delete\": true},\r
          \"spools\": {\"view\": true, \"create\": true, \"edit\": true, \"delete\": true},\r
          \"revisions\": {\"view\": true, \"create\": true, \"edit\": true}\r
        }\r
      }',
      true
    ),
    (
      target_company_id,
      'Control Document',
      'Gestión documental. Carga de planos, control de versiones y transmittals.',
      'admin',
      '#06b6d4',
      '{
        "modules": {
          "engineering": {"enabled": true, "is_home": true}
        },
        "resources": {
          "documents": {"view": true, "create": true, "edit": true, "delete": true},
          "revisions": {"view": true, "create": true, "edit": true},
          "transmittals": {"view": true, "create": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Secretario Piping',
      'Dueño del listado de spools y juntas. Mantiene la integridad de los datos técnicos.',
      'admin',
      '#14b8a6',
      '{
        "modules": {
          "engineering": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false}
        },
        "resources": {
          "spools": {"view": true, "create": true, "edit": true, "delete": true},
          "joints": {"view": true, "create": true, "edit": true},
          "isometrics": {"view": true, "edit": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Secretario Precom',
      'Gestión de carpetas de prueba (Test Packs) y circuitos.',
      'admin',
      '#0ea5e9',
      '{
        "modules": {
          "quality": {"enabled": true, "is_home": true},
          "engineering": {"enabled": true, "is_home": false}
        },
        "resources": {
          "test_packs": {"view": true, "create": true, "edit": true, "delete": true},
          "circuits": {"view": true, "create": true, "edit": true},
          "joints": {"view": true}
        }
      }',
      true
    ),

    -- ═══════════════════════════════════════════════════════
    -- 🚜 NIVEL TERRENO & EJECUCIÓN (Field)
    -- ═══════════════════════════════════════════════════════
    (
      target_company_id,
      'Supervisor Terreno',
      'Responsable de cuadrillas. Reporta avance diario (Montaje, Soldadura) y libera tramos.',
      'supervisor',
      '#f97316',
      '{
        "modules": {
          "field": {"enabled": true, "is_home": true},
          "quality": {"enabled": true, "is_home": false},
          "warehouse": {"enabled": true, "is_home": false}
        },
        "resources": {
          "spools": {"view": true, "edit": true},
          "joints": {"view": true, "create": true, "edit": true},
          "progress_reports": {"view": true, "create": true, "edit": true},
          "materials": {"view": true, "request": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Calidad / QA',
      'Inspector de Calidad. Libera juntas, realiza inspecciones visuales y END.',
      'supervisor',
      '#22c55e',
      '{
        "modules": {
          "quality": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false}
        },
        "resources": {
          "joints": {"view": true, "inspect": true, "approve": true, "reject": true},
          "test_packs": {"view": true, "create": true, "edit": true, "approve": true},
          "ndt_reports": {"view": true, "create": true, "edit": true},
          "spools": {"view": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Jefe de Taller',
      'Gestión de prefabricado (Spools en taller). Reporta avance de taller y despachos a terreno.',
      'supervisor',
      '#a855f7',
      '{
        "modules": {
          "field": {"enabled": true, "is_home": true},
          "warehouse": {"enabled": true, "is_home": false}
        },
        "resources": {
          "spools": {"view": true, "edit": true, "status_update": true},
          "fabrication_reports": {"view": true, "create": true},
          "materials": {"view": true, "request": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Logística / Bodega',
      'Control de materiales. Recepción, inventario y despacho de materiales a frentes de trabajo.',
      'supervisor',
      '#64748b',
      '{
        "modules": {
          "warehouse": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false}
        },
        "resources": {
          "materials": {"view": true, "create": true, "edit": true, "delete": true},
          "inventory": {"view": true, "adjust": true},
          "receiving": {"view": true, "create": true},
          "dispatch": {"view": true, "create": true},
          "spools": {"view": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Expeditor',
      'Seguimiento de materiales externos (Vendor). Actualiza estados de llegada.',
      'worker',
      '#6366f1',
      '{
        "modules": {
          "warehouse": {"enabled": true, "is_home": true}
        },
        "resources": {
          "materials": {"view": true, "status_update": true},
          "vendor_tracking": {"view": true, "edit": true}
        }
      }',
      true
    ),

    -- ═══════════════════════════════════════════════════════
    -- 👷 NIVEL OPERATIVO (Workforce)
    -- ═══════════════════════════════════════════════════════
    (
      target_company_id,
      'Capataz',
      'Lidera una cuadrilla específica. Visualiza sus tareas y puede reportar avance simple.',
      'worker',
      '#f59e0b',
      '{
        "modules": {
          "field": {"enabled": true, "is_home": true}
        },
        "resources": {
          "spools": {"view": true},
          "joints": {"view": true},
          "my_tasks": {"view": true, "update": true},
          "progress_reports": {"view": true, "create": true}
        }
      }',
      true
    ),
    (
      target_company_id,
      'Operario / Soldador',
      'Visualización de planos QR. Acceso a sus propias calificaciones o tareas asignadas.',
      'worker',
      '#94a3b8',
      '{
        "modules": {
          "field": {"enabled": true, "is_home": true}
        },
        "resources": {
          "my_tasks": {"view": true},
          "isometrics": {"view": true},
          "my_certifications": {"view": true}
        }
      }',
      true
    )
  ON CONFLICT (company_id, name) DO NOTHING;

  GET DIAGNOSTICS roles_created = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Standard roles cloned successfully',
    'roles_created', roles_created
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error cloning roles: ' || SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clone_standard_piping_roles(uuid) TO authenticated;

COMMENT ON FUNCTION public.clone_standard_piping_roles IS 'Clones the 14 standard piping construction roles to a company';

-- ==========================================
-- USAGE EXAMPLE
-- ==========================================

-- To clone roles for a specific company, run:
-- SELECT public.clone_standard_piping_roles('your-company-uuid-here');
