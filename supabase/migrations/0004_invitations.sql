-- Migration 0004: Invitations System
-- Permite a Super Admins invitar Founders a gestionar empresas/proyectos

-- Tabla de Invitaciones
create table if not exists public.invitations (
    id uuid primary key default gen_random_uuid(),
    
    -- Who sent it
    inviter_id uuid references auth.users(id) on delete cascade,
    
    -- Who it's for
    email text not null check (email = lower(email)),
    
    -- Context (empresa + proyecto)
    company_id uuid not null references public.companies(id) on delete cascade,
    project_id uuid references public.projects(id) on delete cascade,
    
    -- Role to assign
    role_id text not null check (role_id in ('founder', 'admin', 'supervisor', 'worker')),
    
    -- Status tracking
    status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
    token text unique not null default encode(gen_random_bytes(32), 'hex'),
    
    -- Timestamps
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '7 days'),
    accepted_at timestamptz,
    accepted_by uuid references auth.users(id)
);

-- Indexes para búsqueda rápida
create index if not exists idx_invitations_email on public.invitations(email);
create index if not exists idx_invitations_token on public.invitations(token);
create index if not exists idx_invitations_status on public.invitations(status);
create index if not exists idx_invitations_company on public.invitations(company_id);
create index if not exists idx_invitations_project on public.invitations(project_id);

-- RLS Policies
alter table public.invitations enable row level security;

-- Super admins pueden ver y crear todas las invitaciones
create policy "Super admins full access to invitations"
  on public.invitations
  for all
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );

-- Founders pueden ver invitaciones que ellos crearon
create policy "Founders can view their own invitations"
  on public.invitations
  for select
  using (inviter_id = auth.uid());

-- Users can view invitations sent to their email (para aceptar)
create policy "Users can view invitations for their email"
  on public.invitations
  for select
  using (
    email = (select email from auth.users where id = auth.uid())
  );

-- Users can update invitations sent to their email (para aceptar)
create policy "Users can accept their own invitations"
  on public.invitations
  for update
  using (
    email = (select email from auth.users where id = auth.uid())
    and status = 'pending'
    and expires_at > now()
  );

-- Función para validar token de invitación
create or replace function public.validate_invitation_token(token_input text)
returns table (
    is_valid boolean,
    invitation_data jsonb
)
language plpgsql
security definer
as $$
declare
    inv_record record;
begin
    select * into inv_record
    from public.invitations
    where token = token_input
    and status = 'pending'
    and expires_at > now();

    if inv_record is not null then
        return query select 
            true, 
            to_jsonb(inv_record);
    else
        return query select 
            false, 
            null::jsonb;
    end if;
end;
$$;

-- Función para aceptar invitación (crea member automáticamente)
create or replace function public.accept_invitation(
    token_input text,
    user_id_input uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
    inv_record record;
    member_record record;
    result jsonb;
begin
    -- Validar invitación
    select * into inv_record
    from public.invitations
    where token = token_input
    and status = 'pending'
    and expires_at > now();

    if inv_record is null then
        return jsonb_build_object(
            'success', false,
            'message', 'Invitación inválida o expirada'
        );
    end if;

    -- Verificar que email coincida
    if inv_record.email != (select email from auth.users where id = user_id_input) then
        return jsonb_build_object(
            'success', false,
            'message', 'Esta invitación no es para tu email'
        );
    end if;

    -- Verificar si ya es miembro
    if exists (
        select 1 from public.members
        where user_id = user_id_input
        and company_id = inv_record.company_id
    ) then
        return jsonb_build_object(
            'success', false,
            'message', 'Ya eres miembro de esta empresa'
        );
    end if;

    -- Crear member record
    insert into public.members (
        user_id,
        company_id,
        project_id,
        role_id,
        status
    ) values (
        user_id_input,
        inv_record.company_id,
        inv_record.project_id,
        inv_record.role_id,
        'ACTIVE'
    )
    returning * into member_record;

    -- Marcar invitación como aceptada
    update public.invitations
    set 
        status = 'accepted',
        accepted_at = now(),
        accepted_by = user_id_input
    where id = inv_record.id;

    return jsonb_build_object(
        'success', true,
        'message', 'Invitación aceptada exitosamente',
        'member', to_jsonb(member_record)
    );
end;
$$;
