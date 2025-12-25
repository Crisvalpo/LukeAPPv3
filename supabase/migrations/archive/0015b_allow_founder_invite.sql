-- Permitir a los Founders crear invitaciones para su propia empresa
CREATE POLICY "Founders can create invitations for their company"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.members 
    WHERE members.user_id = auth.uid() 
    AND members.role_id = 'founder'
    AND members.company_id = company_id -- company_id de la nueva invitación
  )
);

-- Asegurar que también puedan ver las invitaciones que acaban de crear (o todas las de su empresa)
-- (Probablemente ya exista una de SELECT, pero por seguridad reforzamos o creamos si falta)
CREATE POLICY "Founders can view invitations for their company"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.members 
    WHERE members.user_id = auth.uid() 
    AND members.role_id = 'founder'
    AND members.company_id = invitations.company_id
  )
);

-- Permitir borrar (revocar) invitaciones de su empresa
CREATE POLICY "Founders can delete invitations for their company"
ON public.invitations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.members 
    WHERE members.user_id = auth.uid() 
    AND members.role_id = 'founder'
    AND members.company_id = invitations.company_id
  )
);
