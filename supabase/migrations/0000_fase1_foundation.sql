-- LUKEAPP V3 - FASE 1 FOUNDATION SCHEMA (CONSOLIDATED)
-- Fecha: 25/12/2025
-- Descripción: Schema completo de la Fase 1 (Identity, Multi-tenant, Invitations)

-- 1. RESET (Opcional, para asegurar limpieza en entornos dev)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. ENUMS
CREATE TYPE public.user_role AS ENUM ('super_admin', 'founder', 'admin', 'supervisor', 'worker');
CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- 4. TABLES

-- Roles (Catalogo estático)
CREATE TABLE public.roles (
    id public.user_role PRIMARY KEY,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Users (Perfiles públicos - Espejo de auth.users)
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Companies (Tenants)
CREATE TABLE public.companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    code text NOT NULL,
    description text,
    contract_number text DEFAULT 'S/N',
    client_name text DEFAULT 'Cliente Interno',
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status public.project_status DEFAULT 'planning',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_id, code)
);

-- Members (Relación User <-> Company/Project)
CREATE TABLE public.members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL, -- Null pattern allows company-wide roles
    role_id public.user_role NOT NULL REFERENCES public.roles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, company_id, project_id) -- Prevent duplicate membership in same context
);

-- Invitations
CREATE TABLE public.invitations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    role_id public.user_role NOT NULL,
    status public.invitation_status DEFAULT 'pending',
    invited_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '7 days')
);


-- 5. ROW LEVEL SECURITY (RLS) -- The Heart of Multi-tenancy

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE POLICY "Public read access roles" ON public.roles FOR SELECT USING (true);

-- USERS
-- Users can read their own profile
CREATE POLICY "Read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
-- Staff can read all profiles (to list users)
CREATE POLICY "Staff read all profiles" ON public.users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
-- Update own profile
CREATE POLICY "Update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);


-- COMPANIES
-- Staff: Full Access
CREATE POLICY "Staff full access companies" ON public.companies FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
-- Founder: Read Own Company
CREATE POLICY "Founder read own company" ON public.companies FOR SELECT USING (
    id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);


-- PROJECTS
-- Staff: Full Access
CREATE POLICY "Staff full access projects" ON public.projects FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
-- Founder: Full Access to Own Company Projects
CREATE POLICY "Founder full access projects" ON public.projects FOR ALL USING (
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);
-- Member: Read Assigned Projects
CREATE POLICY "Member read assigned projects" ON public.projects FOR SELECT USING (
    id IN (SELECT project_id FROM public.members WHERE user_id = auth.uid()) 
    OR 
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND project_id IS NULL) -- Company-wide access check
);


-- MEMBERS
-- Staff: Full Access
CREATE POLICY "Staff full access members" ON public.members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
-- Founder: Manage Own Company Members
CREATE POLICY "Founder manage company members" ON public.members FOR ALL USING (
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);
-- Self: Read Own Membership
CREATE POLICY "Read own membership" ON public.members FOR SELECT USING (user_id = auth.uid());


-- INVITATIONS
-- Staff: Full Access
CREATE POLICY "Staff full access invitations" ON public.invitations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role_id = 'super_admin')
);
-- Founder: Manage Own Company Invitations
CREATE POLICY "Founder manage invitations" ON public.invitations FOR ALL USING (
    company_id IN (SELECT company_id FROM public.members WHERE user_id = auth.uid() AND role_id = 'founder')
);
-- Public: Read by Token (For acceptance page)
-- CREATE POLICY "Public read invitation by token" ON public.invitations FOR SELECT USING (true); -- Often handled by service role in backend, or specific function.
-- Security Note: Reading invitations publicly is risky. We usually use secure RPC or verify token via function.
-- For now, allow SELECT if you know the token (implicitly controlled by app logic) or if authenticated user is the target?
-- Let's stick to Authed access OR Service Role. The accept page uses a service call usually.
-- Updated: Allow reading invitation if email matches (for session conflict check)
CREATE POLICY "Read own invitation by email" ON public.invitations FOR SELECT USING (
    email = auth.jwt() ->> 'email'
);


-- 6. FUNCTIONS & TRIGGERS

-- Handle New User -> Public Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 7. SEED DATA
INSERT INTO public.roles (id, description) VALUES
    ('super_admin', 'Staff LukeAPP - Control Total'),
    ('founder', 'Fundador - Dueño de Empresa y Proyectos'),
    ('admin', 'Administrador - Gestión de Proyecto'),
    ('supervisor', 'Supervisor - Gestión Técnica y Terreno'),
    ('worker', 'Trabajador - Acceso Básico')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;
