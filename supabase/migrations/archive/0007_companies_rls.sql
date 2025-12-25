-- RLS Policies for Companies table

-- Enable RLS
alter table public.companies enable row level security;

-- Super admins can do everything
create policy "Super admins can insert companies"
  on public.companies
  for insert
  with check (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );

create policy "Super admins can select all companies"
  on public.companies
  for select
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );

create policy "Super admins can update companies"
  on public.companies
  for update
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.role_id = 'super_admin'
    )
  );

-- Founders can view and update their own company
create policy "Founders can select their company"
  on public.companies
  for select
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.company_id = companies.id
      and members.role_id = 'founder'
    )
  );

create policy "Founders can update their company"
  on public.companies
  for update
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.company_id = companies.id
      and members.role_id = 'founder'
    )
  );

-- Everyone can see companies they're members of
create policy "Members can view their company"
  on public.companies
  for select
  using (
    exists (
      select 1 from public.members
      where members.user_id = auth.uid()
      and members.company_id = companies.id
    )
  );
