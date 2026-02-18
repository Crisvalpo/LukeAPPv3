-- FIX: Multidiscipline Roles with Unicode-safe encoding
-- UPDATED: 14 Roles aligned with Specialty system (Piping, Structural, Electrical, etc.)
-- Uses E'' escape strings with \uXXXX for accented characters to guarantee encoding integrity.

-- Helper: Common accented chars used below:
-- \u00e1 = á  |  \u00e9 = é  |  \u00ed = í  |  \u00f3 = ó  |  \u00fa = ú
-- \u00f1 = ñ  |  \u00c1 = Á  |  \u00c9 = É  |  \u00cd = Í  |  \u00d3 = Ó

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

  -- Insert the 14 standard multidiscipline roles
  INSERT INTO public.company_roles (company_id, name, description, base_role, color, permissions, is_template)
  VALUES
    -- 1. Gerencia / Jefe de Proyecto (supervisor)
    (
      target_company_id,
      E'Gerencia / Jefe de Proyecto',
      E'Visibilidad completa del proyecto. Dashboards financieros y de avance. Solo lectura y aprobaciones de alto nivel.',
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
      }'::jsonb,
      false
    ),
    -- 2. Cliente / ITO (supervisor)
    (
      target_company_id,
      E'Cliente / ITO',
      E'Inspector T\u00e9cnico de Obra. Visibilidad completa. Aprobaci\u00f3n/Rechazo de protocolos de prueba.',
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
          "inspections": {"view": true, "inspect": true},
          "reports": {"view": true, "export": true}
        }
      }'::jsonb,
      false
    ),
    -- 3. P&C (Planificación) (supervisor)
    (
      target_company_id,
      E'P&C (Planificaci\u00f3n)',
      E'Control de Proyecto. Acceso a reportes de avance y curvas S. Comparaci\u00f3n Programado vs Real.',
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
      }'::jsonb,
      false
    ),
    -- 4. Jefe Oficina Técnica (admin)
    (
      target_company_id,
      E'Jefe Oficina T\u00e9cnica',
      E'Control total de la ingenier\u00eda del proyecto. Carga de datos, gesti\u00f3n documental y revisiones.',
      'admin',
      '#10b981',
      '{
        "modules": {
          "engineering": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false},
          "quality": {"enabled": true, "is_home": false}
        },
        "resources": {
          "lines": {"view": true, "create": true, "edit": true, "delete": true},
          "isometrics": {"view": true, "create": true, "edit": true, "delete": true},
          "components": {"view": true, "create": true, "edit": true, "delete": true},
          "mto": {"view": true, "create": true, "edit": true, "delete": true}
        }
      }'::jsonb,
      false
    ),
    -- 5. Control Documental (admin)
    (
      target_company_id,
      E'Control Documental',
      E'Gesti\u00f3n documental. Carga de planos, control de versiones y transmittals.',
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
      }'::jsonb,
      false
    ),
    -- 6. Secretario Técnico (admin) — antes "Secretario Piping"
    (
      target_company_id,
      E'Secretario T\u00e9cnico',
      E'Due\u00f1o del listado maestro de la disciplina. Mantiene la integridad y trazabilidad de los datos t\u00e9cnicos.',
      'admin',
      '#14b8a6',
      '{
        "modules": {
          "engineering": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false}
        },
        "resources": {
          "components": {"view": true, "create": true, "edit": true, "delete": true},
          "master_lists": {"view": true, "create": true, "edit": true},
          "isometrics": {"view": true, "edit": true}
        }
      }'::jsonb,
      false
    ),
    -- 7. Secretario Precomisionado (admin)
    (
      target_company_id,
      E'Secretario Precomisionado',
      E'Gesti\u00f3n de carpetas de prueba y circuitos de precomisionado.',
      'admin',
      '#0ea5e9',
      '{
        "modules": {
          "quality": {"enabled": true, "is_home": true},
          "engineering": {"enabled": true, "is_home": false}
        },
        "resources": {
          "test_packs": {"view": true, "create": true, "edit": true, "delete": true},
          "circuits": {"view": true, "create": true, "edit": true}
        }
      }'::jsonb,
      false
    ),
    -- 8. Supervisor de Terreno (supervisor)
    (
      target_company_id,
      E'Supervisor de Terreno',
      E'Responsable de cuadrillas. Reporta avance diario de actividades y libera tramos o secciones.',
      'supervisor',
      '#f97316',
      '{
         "modules": {
           "field": {"enabled": true, "is_home": true},
           "quality": {"enabled": true, "is_home": false},
           "warehouse": {"enabled": true, "is_home": false}
         },
         "resources": {
           "components": {"view": true, "edit": true},
           "progress_reports": {"view": true, "create": true, "edit": true},
           "materials": {"view": true, "request": true}
         }
      }'::jsonb,
      false
    ),
    -- 9. Calidad / QA (supervisor)
    (
      target_company_id,
      E'Calidad / QA',
      E'Inspector de Calidad. Realiza inspecciones, liberaciones y ensayos no destructivos.',
      'supervisor',
      '#22c55e',
      '{
        "modules": {
          "quality": {"enabled": true, "is_home": true},
          "field": {"enabled": true, "is_home": false}
        },
        "resources": {
          "inspections": {"view": true, "inspect": true, "approve": true, "reject": true},
          "test_packs": {"view": true, "create": true, "edit": true, "approve": true},
          "ndt_reports": {"view": true, "create": true, "edit": true}
        }
      }'::jsonb,
      false
    ),
     -- 10. Jefe de Taller / Prefabricado (supervisor)
    (
      target_company_id,
      E'Jefe de Taller / Prefabricado',
      E'Gesti\u00f3n de prefabricado. Reporta avance de taller y despachos a terreno.',
      'supervisor',
      '#a855f7',
      '{
        "modules": {
          "field": {"enabled": true, "is_home": true},
          "warehouse": {"enabled": true, "is_home": false}
        },
        "resources": {
          "components": {"view": true, "edit": true, "status_update": true},
          "fabrication_reports": {"view": true, "create": true},
          "materials": {"view": true, "request": true}
        }
      }'::jsonb,
      false
    ),
    -- 11. Logística / Bodega (supervisor)
    (
      target_company_id,
      E'Log\u00edstica / Bodega',
      E'Control de materiales. Recepci\u00f3n, inventario y despacho a frentes de trabajo.',
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
          "dispatch": {"view": true, "create": true}
        }
      }'::jsonb,
      false
    ),
    -- 12. Expeditor (worker)
    (
      target_company_id,
      E'Expeditor',
      E'Seguimiento de materiales externos (Vendor). Actualiza estados de llegada.',
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
      }'::jsonb,
      false
    ),
    -- 13. Capataz (worker)
    (
      target_company_id,
      E'Capataz',
      E'Lidera una cuadrilla espec\u00edfica. Visualiza tareas asignadas y puede reportar avance.',
      'worker',
      '#f59e0b',
      '{
        "modules": {
          "field": {"enabled": true, "is_home": true}
        },
        "resources": {
          "components": {"view": true},
          "my_tasks": {"view": true, "update": true},
          "progress_reports": {"view": true, "create": true}
        }
      }'::jsonb,
      false
    ),
    -- 14. Operario / Técnico (worker) — antes "Operario / Soldador"
    (
      target_company_id,
      E'Operario / T\u00e9cnico',
      E'Visualizaci\u00f3n de planos v\u00eda QR. Acceso a tareas asignadas y calificaciones propias.',
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
      }'::jsonb,
      false
    );

  GET DIAGNOSTICS roles_created = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Roles standard cloned successfully',
    'roles_created', roles_created
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;
