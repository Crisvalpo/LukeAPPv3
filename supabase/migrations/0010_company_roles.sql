-- =====================================================
-- Migration: Company Roles System (Dynamic Functional Roles)
-- Description: Creates company_roles table for flexible, company-defined roles
-- Author: LukeAPP Development Team
-- Date: 2025-12-26
-- =====================================================

-- ==========================================
-- 1. CREATE COMPANY_ROLES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.company_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Role Display Information
  name text NOT NULL,
  description text,
  color text DEFAULT '#64748b', -- Hex color for UI badges
  
  -- Security Mapping (Using text with check constraint instead of enum for better compatibility)
  base_role text NOT NULL CHECK (base_role IN ('admin', 'supervisor', 'worker')), 
  
  -- Permissions Matrix (JSONB)
  permissions jsonb NOT NULL DEFAULT '{
    "modules": {},
    "resources": {}
  }'::jsonb,
  
  -- Template Flag
  is_template boolean DEFAULT false, -- System templates cannot be deleted by users
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_role_per_company UNIQUE(company_id, name),
  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT valid_permissions CHECK (jsonb_typeof(permissions) = 'object')
);

-- ==========================================
-- 2. CREATE INDEXES
-- ==========================================

CREATE INDEX idx_company_roles_company ON public.company_roles(company_id);
CREATE INDEX idx_company_roles_base_role ON public.company_roles(base_role);
CREATE INDEX idx_company_roles_template ON public.company_roles(is_template) WHERE is_template = true;

-- GIN index for JSONB permissions querying
CREATE INDEX idx_company_roles_permissions ON public.company_roles USING gin(permissions);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. RLS POLICIES
-- ==========================================

-- Policy 1: Super Admins (Staff) can do everything
CREATE POLICY "Super admins full access to company roles"
ON public.company_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.user_id = auth.uid()
    AND members.role_id = 'super_admin'
  )
);

-- Policy 2: Founders can manage roles in their company
CREATE POLICY "Founders can manage their company roles"
ON public.company_roles
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM public.members
    WHERE user_id = auth.uid()
    AND role_id = 'founder'
  )
);

-- Policy 3: Admins can view roles in their company
CREATE POLICY "Admins can view their company roles"
ON public.company_roles
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.members
    WHERE user_id = auth.uid()
    AND role_id = 'admin'
  )
);

-- Policy 4: All authenticated users can view roles in their company (for dropdowns)
CREATE POLICY "Members can view their company roles"
ON public.company_roles
FOR SELECT
USING (
  company_id IN (
    SELECT DISTINCT company_id FROM public.members
    WHERE user_id = auth.uid()
  )
);

-- ==========================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_company_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_roles_timestamp
BEFORE UPDATE ON public.company_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_company_roles_updated_at();

-- ==========================================
-- 6. COMMENTS
-- ==========================================

COMMENT ON TABLE public.company_roles IS 'Stores company-defined functional roles with granular module and resource permissions';
COMMENT ON COLUMN public.company_roles.name IS 'Display name of the role (e.g., "Jefe de Calidad", "Pañolero")';
COMMENT ON COLUMN public.company_roles.base_role IS 'Maps to system security role for RLS (admin, supervisor, worker)';
COMMENT ON COLUMN public.company_roles.permissions IS 'JSONB object defining modules and resource-level permissions';
COMMENT ON COLUMN public.company_roles.is_template IS 'If true, this is a system template role that cannot be deleted';
