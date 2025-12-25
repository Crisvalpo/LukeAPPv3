-- Agregar policy para permitir DELETE de invitaciones (Super Admins)

create policy "Super admins can delete invitations"
  on public.invitations
  for delete
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );
