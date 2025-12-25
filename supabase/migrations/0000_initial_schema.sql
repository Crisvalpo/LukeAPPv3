-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  status text default 'IDENTITY_CREATED' check (status in ('IDENTITY_CREATED', 'IDENTITY_VALIDATED', 'COMMUNITY_PENDING', 'COMMUNITY_ACTIVE', 'PROJECT_ACTIVE', 'SUSPENDED')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.profiles is 'System identities. Public profile data.';

-- 2. ROLES
create table if not exists public.roles (
  id text primary key,
  description text,
  created_at timestamptz default now() not null
);

insert into public.roles (id, description) values
('SUPER_ADMIN', 'System wide administrator'),
('COMPANY_OWNER', 'Owner of a tenant'),
('PROJECT_ADMIN', 'Administrator of a specific project'),
('PROJECT_USER', 'Standard user in a project'),
('GUEST', 'Read-only access')
on conflict (id) do nothing;

-- 3. COMPANIES
create table if not exists public.companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null, -- Removed unique constraint for idempotency on re-runs or moved to unique index if needed
  logo_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
-- Ensure slug unique if not exists
do $$ 
begin
  if not exists (select 1 from pg_constraint where conname = 'companies_slug_key') then
    alter table public.companies add constraint companies_slug_key unique (slug);
  end if;
end $$;

-- 4. PROJECTS
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  code text not null,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED', 'SUSPENDED')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. MEMBERS
create table if not exists public.members (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  role_id text references public.roles(id) not null,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'SUSPENDED')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  unique(user_id, company_id, project_id, role_id)
);

-- RLS PROTECTIONS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.projects enable row level security;
alter table public.members enable row level security;

-- Policies (Dropped before create to avoid error)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can view own memberships" on public.members;
create policy "Users can view own memberships" on public.members
  for select using (auth.uid() = user_id);

drop policy if exists "Users can view assigned projects" on public.projects;
create policy "Users can view assigned projects" on public.projects
  for select using (
    exists (
      select 1 from public.members
      where members.project_id = projects.id
      and members.user_id = auth.uid()
    )
  );

-- Database Trigger for New User
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing; -- Idempotent
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
