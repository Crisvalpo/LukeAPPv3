-- Fix: Remove policies que acceden a auth.users (no permitido)
-- Ejecutar este SQL en Supabase

-- Drop policies problemáticas
drop policy if exists "Users can view invitations for their email" on public.invitations;
drop policy if exists "Users can accept their own invitations" on public.invitations;

-- Policy simplificada: Los usuarios pueden ver invitaciones donde son el destinatario
-- Nota: Comparamos email en la app, no en la policy
create policy "Users can view pending invitations"
  on public.invitations
  for select
  using (
    status = 'pending' 
    and expires_at > now()
  );

-- Policy para UPDATE: Solo pueden actualizar sus propias invitaciones
-- mediante la función RPC accept_invitation que valida el email
create policy "Users can update via RPC only"
  on public.invitations
  for update
  using (false);  -- No permitir UPDATE directo, solo via RPC

-- Asegurar que la función accept_invitation tenga SECURITY DEFINER
-- (ya está en la migración original, solo verificar)
