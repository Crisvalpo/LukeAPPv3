/**
 * Database Types - Mirror of Supabase schema
 */

// ===== ENUMS =====

export const ProjectStatus = {
    PLANNING: 'planning',
    ACTIVE: 'active',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus]

export const UserRole = {
    SUPER_ADMIN: 'super_admin',
    FOUNDER: 'founder',
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    WORKER: 'worker'
} as const

export type UserRoleType = typeof UserRole[keyof typeof UserRole]

export const InvitationStatus = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    EXPIRED: 'expired',
    REVOKED: 'revoked'
} as const

export type InvitationStatusType = typeof InvitationStatus[keyof typeof InvitationStatus]

// ===== BASE ENTITIES =====

export interface Company {
    id: string
    name: string
    slug: string
    created_at: string
    updated_at: string
}

export interface Project {
    id: string
    name: string
    code: string
    description: string | null
    company_id: string
    status: ProjectStatusType
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}

export interface Member {
    id: string
    user_id: string
    company_id: string | null
    project_id: string | null
    role_id: UserRoleType
    job_title?: string | null  // Custom role label (e.g., "Jefe de Calidad")
    functional_role_id?: string | null  // FK to company_roles
    created_at: string
}

// ===== COMPANY ROLES (Dynamic Roles System) =====

/**
 * Module configuration in permissions
 */
export interface ModuleConfig {
    enabled: boolean     // Whether user can see this module
    is_home?: boolean    // Whether this is the default dashboard
}

/**
 * Resource-level permissions
 */
export interface ResourcePermissions {
    view?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
    approve?: boolean
    reject?: boolean
    inspect?: boolean
    request?: boolean
    status_update?: boolean
    export?: boolean
    comment?: boolean
    adjust?: boolean
    [key: string]: boolean | undefined  // Allow custom permissions
}

/**
 * Full permissions structure stored in JSONB
 */
export interface RolePermissions {
    modules: {
        dashboard?: ModuleConfig
        engineering?: ModuleConfig
        field?: ModuleConfig
        quality?: ModuleConfig
        warehouse?: ModuleConfig
        [key: string]: ModuleConfig | undefined
    }
    resources: {
        [resourceName: string]: ResourcePermissions
    }
}

/**
 * Company Role entity (from company_roles table)
 */
export interface CompanyRole {
    id: string
    company_id: string
    name: string
    description: string | null
    color: string
    base_role: 'admin' | 'supervisor' | 'worker'  // System role for RLS
    permissions: RolePermissions
    is_template: boolean
    created_at: string
    updated_at: string
}

/**
 * Company Role with usage stats
 */
export interface CompanyRoleWithStats extends CompanyRole {
    members_count: number
}

/**
 * Member with full functional role data
 */
export interface MemberWithFunctionalRole extends Member {
    company_role?: CompanyRole
}


export interface Invitation {
    id: string
    email: string
    token: string
    company_id: string
    project_id: string | null
    role_id: UserRoleType
    job_title?: string | null  // Custom role label (e.g., "Jefe de Calidad")
    functional_role_id?: string | null  // FK to company_roles
    status: InvitationStatusType
    created_at: string
    expires_at: string | null
}

// ===== RELATIONS =====

export interface CompanyWithStats extends Company {
    projects_count: number
    members_count: number
}

export interface ProjectWithStats extends Project {
    members_count: number
}

export interface InvitationWithRelations extends Invitation {
    company?: Pick<Company, 'name' | 'slug'>
    project?: Pick<Project, 'name' | 'code'>
}

export interface MemberWithRelations extends Member {
    user?: Pick<User, 'email' | 'full_name' | 'avatar_url'>
    company?: Pick<Company, 'name' | 'slug'>
    project?: Pick<Project, 'name' | 'code'>
}

// ===== API RESPONSES =====

export interface ApiResponse<T = any> {
    success: boolean
    message: string
    data?: T
}

export interface GlobalStats {
    totalCompanies: number
    totalProjects: number
    totalUsers: number
    pendingInvitations: number
}

// ===== FORM DATA =====

export interface CreateCompanyParams {
    name: string
    slug: string
}

export interface UpdateCompanyParams {
    name?: string
    slug?: string
}

export interface CreateProjectParams {
    name: string
    code: string
    description?: string
    contract_number?: string
    client_name?: string
    company_id: string
}

export interface UpdateProjectParams {
    name?: string
    code?: string
    description?: string
    status?: ProjectStatusType
}

export interface CreateInvitationParams {
    email: string
    company_id: string
    project_id?: string
    role_id: UserRoleType
    job_title?: string  // Custom role label
    functional_role_id?: string  // Reference to company_roles
}

export interface CreateCompanyRoleParams {
    company_id: string
    name: string
    description?: string
    color?: string
    base_role: 'admin' | 'supervisor' | 'worker'
    permissions: RolePermissions
}

export interface UpdateCompanyRoleParams {
    name?: string
    description?: string
    color?: string
    base_role?: 'admin' | 'supervisor' | 'worker'
    permissions?: RolePermissions
}

