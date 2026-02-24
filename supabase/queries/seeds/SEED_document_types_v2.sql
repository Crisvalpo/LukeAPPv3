-- FIX & SEED: Document Types (Global)
-- 1. Ensure uniqueness for Global Types (company_id IS NULL) to allow UPSERT.
-- 2. Insert standard document types.

BEGIN;

-- A. Create Unique Index for Global Types
-- This allows ON CONFLICT (code) WHERE company_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_types_global_code 
ON public.document_types (code) 
WHERE company_id IS NULL;

-- B. Insert Consolidated Types
INSERT INTO public.document_types (name, code, description, company_id) VALUES
-- INGENIERÍA & PLANOS
('Drawing', 'DWG', 'Plano General, Detalles, Arquitectura, Estructuras, Civil, Trazados', NULL),
('P&ID', 'PID', 'Diagramas de Tubería e Instrumentación, Diagramas de Flujo', NULL),
('Isometric', 'ISO', 'Isométricos de Tubería', NULL),
('3D Model', '3DM', 'Modelos 3D, Maquetas Electrónicas, Bases de Datos de Diseño', NULL),

-- DOCUMENTOS TÉCNICOS
('Calculation', 'CAL', 'Memorias de Cálculo, Análisis de Estrés, Balance de Masas/Energía', NULL),
('Specification', 'SPE', 'Especificaciones Técnicas (Pintura, Aislación, Materiales)', NULL),
('Data Sheet', 'DS', 'Hojas de Datos, Fichas Técnicas', NULL),
('List', 'LST', 'Listados (Líneas, Equipos, Materiales, Vendor, Cables, Soportes)', NULL),

-- GESTIÓN & PROCEDIMIENTOS
('Plan', 'PLN', 'Planes de Gestión, Construcción, Transporte, Calidad', NULL),
('Procedure', 'PRO', 'Procedimientos, Metodologías, Instructivos de Trabajo, Welding', NULL),
('Report', 'RPT', 'Informes Técnicos, Reportes de Estado/Avance', NULL),

-- CALIDAD & VENDOR
('Inspection Plan', 'ITP', 'Plan de Inspección y Pruebas (PIT/ITP), Protocolos de Prueba', NULL),
('Manual', 'MAN', 'Manuales de Operación, Mantenimiento, Catálogos de Fabricante', NULL),
('Dossier', 'DOS', 'Libros de Datos (Data Books), Dossiers de Calidad, Welding Books', NULL)

ON CONFLICT (code) WHERE company_id IS NULL 
DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

COMMIT;
