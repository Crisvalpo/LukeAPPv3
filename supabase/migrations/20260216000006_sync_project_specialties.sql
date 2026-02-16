-- Migration: Add missing specialties based on real project model codes
-- Based on user's project: CIV (Civil Works) and ARC (Architecture) are used.

INSERT INTO public.specialties (name, code, description) VALUES
('Civil Works', 'CIV', 'Obras civiles, fundaciones y excavaciones'),
('Architecture', 'ARC', 'Arquitectura, terminaciones y acabados')
ON CONFLICT (code) DO NOTHING;

-- Update Instrumentation for consistency with the screenshot (INST)
UPDATE public.specialties SET code = 'INST' WHERE code = 'INS';
