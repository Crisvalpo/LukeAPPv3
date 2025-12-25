-- Fix RLS policy for invitations - Add WITH CHECK for INSERT
-- Execute este script en Supabase SQL Editor

-- Drop old policy
drop policy if exists "Super admins full access to invitations" on public.invitations;

-- Recreate with proper WITH CHECK
create policy "Super admins full access to invitations"
  on public.invitations
  for all
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );
