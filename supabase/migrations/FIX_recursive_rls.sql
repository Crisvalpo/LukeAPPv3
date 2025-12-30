-- Optimización CRÍTICA para evitar recursión infinita en RLS de members
-- La política actual se consulta a sí misma para verificar si eres super_admin

-- 1. Crear función segura para chequear admin (evita consultar la tabla directamente en la policy)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Se ejecuta con permisos de creador (postgres), salta RLS
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members 
    WHERE user_id = auth.uid() 
    AND role_id = 'super_admin'
  );
$$;

-- 2. Actualizar la política recursiva para usar la función
DROP POLICY IF EXISTS "Staff full access members" ON public.members;

CREATE POLICY "Staff full access members" ON public.members 
FOR ALL 
USING ( public.is_super_admin() );

-- 3. Actualizar otras políticas de Staff para usar la misma función eficiente
DROP POLICY IF EXISTS "Staff full access companies" ON public.companies;
CREATE POLICY "Staff full access companies" ON public.companies FOR ALL USING ( public.is_super_admin() );

DROP POLICY IF EXISTS "Staff full access projects" ON public.projects;
CREATE POLICY "Staff full access projects" ON public.projects FOR ALL USING ( public.is_super_admin() );

DROP POLICY IF EXISTS "Staff full access invitations" ON public.invitations;
CREATE POLICY "Staff full access invitations" ON public.invitations FOR ALL USING ( public.is_super_admin() );

-- 4. Verificación inmediata
SELECT public.is_super_admin() as am_i_admin;
