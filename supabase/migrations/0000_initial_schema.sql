-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Managed identities linked to auth.users)
-- A person is not a user until they act in a context, but they need an identity first.
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  status text default 'IDENTITY_CREATED' check (status in ('IDENTITY_CREATED', 'IDENTITY_VALIDATED', 'COMMUNITY_PENDING', 'COMMUNITY_ACTIVE', 'PROJECT_ACTIVE', 'SUSPENDED')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.profiles is 'System identities. Public profile data.';

-- 2. ROLES (Global definitions)
-- Roles define permissions within a context.
create table public.roles (
  id text primary key, -- e.g. 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_USER'
  description text,
  created_at timestamptz default now() not null
);

insert into public.roles (id, description) values
('SUPER_ADMIN', 'System wide administrator'),
('COMPANY_OWNER', 'Owner of a tenant'),
('PROJECT_ADMIN', 'Administrator of a specific project'),
('PROJECT_USER', 'Standard user in a project'),
('GUEST', 'Read-only access');

-- 3. COMPANIES (Tenants)
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique, -- for url friendly identification
  logo_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. PROJECTS (Belong to Companies)
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  code text not null, -- e.g. 'PRJ-001'
  status text default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED', 'SUSPENDED')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. MEMBERS (Context Association)
-- Links a Profile to a Company/Project with a Role.
-- This is the core of the "Context" concept.
create table public.members (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade, -- Nullable if company-level role
  role_id text references public.roles(id) not null,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'SUSPENDED')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  unique(user_id, company_id, project_id, role_id)
);

-- RLS PROTECTIONS (Basic)
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.projects enable row level security;
alter table public.members enable row level security;

-- Policies (Simplified for initialization)
-- Profiles: Users can read their own profile.
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Members: Users can see memberships for themselves.
create policy "Users can view own memberships" on public.members
  for select using (auth.uid() = user_id);

-- Projects: Users can view projects they are members of.
create policy "Users can view assigned projects" on public.projects
  for select using (
    exists (
      select 1 from public.members
      where members.project_id = projects.id
      and members.user_id = auth.uid()
    )
  );

-- Function to handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
