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


// ===== PHASE 2: REVISION SYSTEM TYPES =====

// Mockup Production Data (Temporary)
export interface Isometric {
    id: string
    project_id: string
    company_id: string
    iso_number: string
    revision: string
    description: string | null
    status: string
    created_at: string
    updated_at: string
}

export interface Spool {
    id: string
    isometric_id: string
    project_id: string
    company_id: string
    spool_number: string
    revision: string
    fabrication_status: 'PENDING' | 'FABRICATED' | 'DISPATCHED' | 'INSTALLED'
    fabricated_at: string | null
    dispatched_at: string | null
    created_at: string
    updated_at: string
}

export interface Weld {
    id: string
    spool_id: string
    project_id: string
    company_id: string
    weld_number: string
    weld_type: string | null
    status: 'PENDING' | 'EXECUTED' | 'QA_APPROVED' | 'QA_REJECTED'
    executed_at: string | null
    executed_by: string | null
    created_at: string
    updated_at: string
}

// Core Revision System
export const RevisionStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    APPLIED: 'APPLIED',
    REJECTED: 'REJECTED'
} as const

export type RevisionStatusType = typeof RevisionStatus[keyof typeof RevisionStatus]

export const RevisionEventType = {
    CREATED: 'CREATED',
    ANNOUNCED: 'ANNOUNCED',
    IMPACT_DETECTED: 'IMPACT_DETECTED',
    APPROVED: 'APPROVED',
    APPLIED: 'APPLIED',
    REJECTED: 'REJECTED',
    RESOLVED: 'RESOLVED'
} as const

export type RevisionEventTypeEnum = typeof RevisionEventType[keyof typeof RevisionEventType]

export const ImpactType = {
    NEW: 'NEW',
    MODIFIED: 'MODIFIED',
    REMOVED: 'REMOVED',
    MATERIAL_CHANGE: 'MATERIAL_CHANGE'
} as const

export type ImpactTypeEnum = typeof ImpactType[keyof typeof ImpactType]

export const ImpactSeverity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
} as const

export type ImpactSeverityEnum = typeof ImpactSeverity[keyof typeof ImpactSeverity]

export const ResolutionType = {
    REWORK: 'REWORK',
    MATERIAL_RETURN: 'MATERIAL_RETURN',
    FREE_JOINT: 'FREE_JOINT',
    TECHNICAL_EXCEPTION: 'TECHNICAL_EXCEPTION',
    CLIENT_APPROVAL: 'CLIENT_APPROVAL'
} as const

export type ResolutionTypeEnum = typeof ResolutionType[keyof typeof ResolutionType]

// ===== MATERIAL CONTROL =====

export const MaterialRequestType = {
    CLIENT_MIR: 'CLIENT_MIR',
    CONTRACTOR_PO: 'CONTRACTOR_PO'
} as const

export type MaterialRequestTypeEnum = typeof MaterialRequestType[keyof typeof MaterialRequestType]

export const MaterialRequestStatus = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    PARTIAL: 'PARTIAL',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED'
} as const

export type MaterialRequestStatusEnum = typeof MaterialRequestStatus[keyof typeof MaterialRequestStatus]

export const MaterialInstanceStatus = {
    ISSUED: 'ISSUED',
    CUT: 'CUT',
    INSTALLED: 'INSTALLED',
    SCRAP: 'SCRAP'
} as const

export type MaterialInstanceStatusEnum = typeof MaterialInstanceStatus[keyof typeof MaterialInstanceStatus]

export const DataStatus = {
    VACIO: 'VACIO',
    EN_DESARROLLO: 'EN_DESARROLLO',
    COMPLETO: 'COMPLETO',
    BLOQUEADO: 'BLOQUEADO'
} as const

export type DataStatusEnum = typeof DataStatus[keyof typeof DataStatus]

export const MaterialStatus = {
    NO_REQUERIDO: 'NO_REQUERIDO',
    PENDIENTE_COMPRA: 'PENDIENTE_COMPRA',
    PENDIENTE_APROBACION: 'PENDIENTE_APROBACION',
    EN_TRANSITO: 'EN_TRANSITO',
    DISPONIBLE: 'DISPONIBLE',
    ASIGNADO: 'ASIGNADO'
} as const

export type MaterialStatusEnum = typeof MaterialStatus[keyof typeof MaterialStatus]

export const SpoolType = {
    PIPE_STICK: 'PIPE_STICK',
    SIMPLE: 'SIMPLE',
    COMPLEX: 'COMPLEX'
} as const

export type SpoolTypeEnum = typeof SpoolType[keyof typeof SpoolType]

export interface MaterialRequest {
    id: string
    project_id: string
    company_id: string
    request_number: string
    request_type: MaterialRequestTypeEnum
    status: MaterialRequestStatusEnum
    requested_date: string
    eta_date: string | null
    notes: string | null
    created_at: string
}

export interface MaterialRequestItem {
    id: string
    request_id: string
    material_spec: string
    quantity_requested: number
    quantity_approved: number | null
    quantity_received: number
    spool_id: string | null
    isometric_id: string | null
    unit_price: number | null
    created_at: string
}

export interface MaterialReceipt {
    id: string
    request_id: string
    project_id: string
    receipt_date: string
    delivery_note: string | null
    received_by: string | null
    notes: string | null
    created_at: string
}

export interface MaterialReceiptItem {
    id: string
    receipt_id: string
    request_item_id: string
    quantity: number
    batch_id: string | null
    created_at: string
}

export interface MaterialInventory {
    id: string
    project_id: string
    company_id: string
    material_spec: string
    quantity_available: number
    quantity_allocated: number
    location: string | null
    source_request_id: string | null
    created_at: string
}

export interface MaterialInstance {
    id: string
    project_id: string
    company_id: string
    qr_code: string
    material_spec: string
    source_batch_id: string | null
    spool_id: string | null
    request_item_id: string | null
    status: MaterialInstanceStatusEnum
    created_at: string
}

export interface EngineeringRevision {
    id: string
    isometric_id: string
    project_id: string
    company_id: string
    rev_code: string
    revision_status: string
    transmittal?: string | null
    announcement_date?: string | null
    created_at: string

    // New status fields (FASE 2A)
    data_status: DataStatusEnum
    material_status: MaterialStatusEnum

    // Computed/joined fields
    iso_number?: string
    welds_count?: number
    spools_count?: number
    glb_model_url?: string | null
    model_data?: any
}

export interface StructureModel {
    id: string
    project_id: string
    name: string
    area: string | null
    model_url: string
    created_at: string
}

// Phase 6: Weld Type Configuration (Union Types)
export interface WeldTypeConfig {
    id: string
    project_id: string
    company_id: string
    type_code: string // BW, SW, TW, FL, GR, etc.
    type_name_es: string
    type_name_en?: string | null
    requires_welder: boolean
    icon: string
    color: string
    created_at: string
    updated_at: string
}

export interface RevisionEvent {
    id: string
    revision_id: string
    event_type: RevisionEventTypeEnum
    payload: Record<string, any> | null
    created_by: string
    created_at: string
}

export interface RevisionImpact {
    id: string
    revision_id: string
    impact_type: ImpactTypeEnum
    affected_entity_type: 'spool' | 'weld'
    affected_entity_id: string
    severity: ImpactSeverityEnum
    resolution_type: ResolutionTypeEnum | null
    resolution_notes: string | null
    resolved_by: string | null
    resolved_at: string | null
    created_at: string
    updated_at: string
}

// Helper types for revision workflow
export interface CreateRevisionParams {
    project_id: string
    company_id: string
    rev_id: string
    entity_type: 'isometric' | 'line' | 'spool'
    entity_id: string
}

export interface ProductionStatus {
    hasFabrication: boolean
    hasWelds: boolean
    hasDispatch: boolean
}

export type ProductionLevel = 'ENGINEERING_ONLY' | 'FABRICATED_ONLY' | 'IN_PROGRESS'

// Material Control helper types
export interface CreateMaterialRequestParams {
    project_id: string
    request_type: MaterialRequestTypeEnum
    notes?: string
    items: {
        material_spec: string
        quantity_requested: number
        spool_id?: string
        isometric_id?: string
    }[]
}

export interface CreateMaterialReceiptParams {
    request_id: string
    delivery_note?: string
    items: {
        request_item_id: string
        quantity: number
        batch_id?: string
    }[]
}
