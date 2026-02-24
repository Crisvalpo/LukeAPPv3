-- Seed: Standard Document Types (Consolidated)
-- Includes comprehensive list requested by user, grouped by category.

INSERT INTO public.document_types (name, code, description) VALUES
-- ENGINEERING DRAWINGS
('Drawing', 'DWG', 'Plano General, Detalles, Arquitectura, Estructuras, Civil, Trazados'),
('P&ID', 'PID', 'Diagramas de Tubería e Instrumentación, Diagramas de Flujo'),
('Isometric', 'ISO', 'Isométricos de Tubería'),
('3D Model', '3DM', 'Modelos 3D, Maquetas Electrónicas, Bases de Datos de Diseño'),

-- ENGINEERING DOCUMENTS
('Calculation', 'CAL', 'Memorias de Cálculo, Análisis de Estrés, Balance de Masas/Energía'),
('Specification', 'SPE', 'Especificaciones Técnicas (Pintura, Aislación, Materiales)'),
('Data Sheet', 'DS', 'Hojas de Datos, Fichas Técnicas'),
('List', 'LST', 'Listados (Líneas, Equipos, Materiales, Vendor, Cables, Soportes)'),

-- MANAGEMENT & PLANNING
('Plan', 'PLN', 'Planes de Gestión, Construcción, Transporte, Calidad'),
('Procedure', 'PRO', 'Procedimientos, Metodologías, Instructivos de Trabajo'),
('Report', 'RPT', 'Informes Técnicos, Reportes de Estado/Avance'),

-- QUALITY & VENDOR
('Inspection Plan', 'ITP', 'Plan de Inspección y Pruebas (PIT/ITP), Protocolos de Prueba'),
('Manual', 'MAN', 'Manuales de Operación, Mantenimiento, Catálogos de Fabricante'),
('Dossier', 'DOS', 'Libros de Datos (Data Books), Dossiers de Calidad, Welding Books')

ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;
