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
    company_id: string
    project_id: string | null
    role_id: UserRoleType
    created_at: string
}

export interface Invitation {
    id: string
    email: string
    token: string
    company_id: string
    project_id: string | null
    role_id: UserRoleType
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
}
