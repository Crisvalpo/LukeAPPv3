-- ========================================
-- ARREGLAR ESQUEMA Y RLS DE spool_tags_registry
-- ========================================
-- Fecha: 2026-02-04
-- Problema: Falta columna company_id en local, necesaria para RLS.

-- 1. AGREGAR COLUMNA FALTANTE (Si no existe)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='spool_tags_registry' AND column_name='company_id') THEN
        ALTER TABLE public.spool_tags_registry ADD COLUMN company_id uuid REFERENCES public.companies(id);
        
        -- Poblar company_id desde la tabla projects para registros existentes
        UPDATE public.spool_tags_registry str
        SET company_id = p.company_id
        FROM public.projects p
        WHERE str.project_id = p.id;
        
        -- Ahora poner como NOT NULL (opcional según si quieres 100% igual a Cloud)
        -- ALTER TABLE public.spool_tags_registry ALTER COLUMN company_id SET NOT NULL;
    END IF;
END $$;

-- 2. APLICAR POLÍTICAS RLS (Ahora que la columna existe)

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Staff can manage tags" ON public.spool_tags_registry;
DROP POLICY IF EXISTS "policy_spool_tags_registry_isolation" ON public.spool_tags_registry;
DROP POLICY IF EXISTS "tags_company_access" ON public.spool_tags_registry;
DROP POLICY IF EXISTS "Users can view tags from their projects" ON public.spool_tags_registry;
DROP POLICY IF EXISTS "Staff full access spool_tags_registry" ON public.spool_tags_registry;

-- 2.1 Staff can manage tags (ALL)
CREATE POLICY "Staff can manage tags" ON public.spool_tags_registry
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid() 
      AND project_id = spool_tags_registry.project_id 
      AND role_id IN ('admin', 'supervisor', 'founder')
  )
);

-- 2.2 Isolation policy (ALL)
CREATE POLICY "policy_spool_tags_registry_isolation" ON public.spool_tags_registry
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid() 
      AND company_id = spool_tags_registry.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid() 
      AND company_id = spool_tags_registry.company_id
  )
);

-- 2.3 Company access (ALL)
CREATE POLICY "tags_company_access" ON public.spool_tags_registry
FOR ALL
USING (
  company_id IN (
    SELECT m.company_id FROM members m 
    WHERE m.user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT m.company_id FROM members m 
    WHERE m.user_id = auth.uid()
  )
);

-- 2.4 Select project tags (SELECT)
CREATE POLICY "Users can view tags from their projects" ON public.spool_tags_registry
FOR SELECT
USING (
  project_id IN (
    SELECT m.project_id FROM members m 
    WHERE m.user_id = auth.uid()
  )
);

-- Verificación final
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'spool_tags_registry' AND column_name = 'company_id';

SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'spool_tags_registry' 
ORDER BY cmd;
