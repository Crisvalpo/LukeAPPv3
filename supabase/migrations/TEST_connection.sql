-- Migración de prueba para verificar conexión al PROYECTO NUEVO
-- Si ves esta tabla en el dashboard, significa que la conexión es correcta.

CREATE TABLE IF NOT EXISTS public.test_connection_v2 (
    id SERIAL PRIMARY KEY,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    project_ref TEXT DEFAULT 'bzjxkraxkhsrflwthiqv'
);

INSERT INTO public.test_connection_v2 (project_ref) VALUES ('bzjxkraxkhsrflwthiqv');

-- Output para confirmar
DO $$
BEGIN
    RAISE NOTICE '✅ Conexión exitosa a proyecto: bzjxkraxkhsrflwthiqv';
END $$;
