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

export const SubscriptionStatus = {
    ACTIVE: 'active',
    PAST_DUE: 'past_due',
    SUSPENDED: 'suspended'
} as const

export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus]

export const SubscriptionTier = {
    STARTER: 'starter',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
} as const

export type SubscriptionTierType = typeof SubscriptionTier[keyof typeof SubscriptionTier]

// ===== SUBSCRIPTION TYPES =====

export interface SubscriptionPlan {
    id: string // 'starter', 'pro', 'enterprise'
    name: string
    description?: string
    price_monthly: number
    max_users: number
    max_projects: number
    max_spools: number | null
    max_storage_gb: number
    features: string[]
    is_active: boolean
    created_at: string
}

export interface CompanySubscriptionInfo {
    tier: SubscriptionTierType
    status: SubscriptionStatusType
    end_date: string | null
    suspended_at: string | null
    deletion_date: string | null
    days_until_deletion: number | null
    hours_until_deletion: number | null
    minutes_until_deletion: number | null
    current_users: number
    max_users: number
    current_projects: number
    max_projects: number
    current_spools: number
    max_spools: number
    current_storage_gb: number
    max_storage_gb: number
    is_active: boolean
    // New fields for plan limits vs overrides
    plan_max_users?: number
    plan_max_projects?: number
}

// ===== BASE ENTITIES =====

export interface Company {
    id: string
    name: string
    slug: string
    subscription_status: SubscriptionStatusType
    subscription_tier: SubscriptionTierType
    subscription_end_date: string | null
    suspended_at: string | null
    payment_instructions: string | null
    created_at: string
    updated_at: string
    custom_users_limit?: number | null
    custom_projects_limit?: number | null
    // Computed fields
    projects_count?: number
    members_count?: number
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
    primary_specialty_id?: string | null // FK to specialties (Industrial Context)
    created_at: string
}

// ===== AWP / GEOGRAPHY =====

/**
 * Area - Represents a Construction Work Area (CWA)
 */
export interface Area {
    id: string
    project_id: string
    company_id: string
    name: string
    code: string
    description: string | null
    created_at: string
    updated_at: string
}

/**
 * WorkFront - Represents an Installation Work Package (IWP)
 */
export interface WorkFront {
    id: string
    area_id: string
    project_id: string
    company_id: string
    name: string
    code: string
    description: string | null
    status: 'PLANNING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
    priority: number
    created_at: string
    updated_at: string
}

// ===== SPECIALTIES =====

/**
 * Specialty - Represents an industrial discipline (Piping, Electrical, etc.)
 */
export interface Specialty {
    id: string
    name: string
    code: string
    description: string | null
    created_at: string
    updated_at: string
}

/**
 * ProjectSpecialty - Join table between projects and specialties
 */
export interface ProjectSpecialty {
    project_id: string
    specialty_id: string
    is_active: boolean
    created_at: string
    // Optional joined data
    specialty?: Specialty
}

// ===== COMPANY ROLES (Dynamic Roles System) =====

/**
 * Module configuration in permissions
 */
export interface ModuleConfig {
    can_create: boolean
    can_read: boolean
    can_update: boolean
    can_delete: boolean
}

/**
 * Complete permissions object (JSONB in DB)
 */
export interface RolePermissions {
    modules?: {
        [key: string]: {
            enabled: boolean
            is_home?: boolean
        }
    }
    isometricos?: ModuleConfig
    levantamientos?: ModuleConfig
    lineas?: ModuleConfig
    materiales?: ModuleConfig
    resources?: Record<string, any>
}

/**
 * CompanyRole - Dynamic, company-defined roles
 * Each company can create their own roles (e.g., "Jefe de Calidad", "Pañolero")
 */
export interface CompanyRole {
    id: string
    company_id: string
    name: string  // E.g., "Jefe de Calidad"
    description: string | null
    color: string
    base_role: 'admin' | 'supervisor' | 'worker'
    permissions: RolePermissions
    is_template: boolean
    created_at: string
    updated_at: string
}

export interface CompanyRoleWithStats extends CompanyRole {
    members_count: number
}

// ===== INVITATIONS =====

export interface Invitation {
    id: string
    company_id: string
    project_id: string | null
    role_id: UserRoleType
    functional_role_id?: string | null  // FK to company_roles
    email: string
    inviter_id: string
    status: InvitationStatusType
    expires_at: string
    created_at: string
}

// View-Like Aggregations

export interface InvitationWithDetails extends Invitation {
    company_name?: string
    project_name?: string | null
    inviter_name?: string | null
}

// Helper types for invitation workflow
export interface CreateInvitationParams {
    company_id: string
    project_id?: string | null
    role_id: UserRoleType
    functional_role_id?: string | null
    email: string
}

// ===== MASTER VIEWS =====

/**
 * MasterView - Central registry for file uploads (isometrics, line plans, etc.)
 */
export interface MasterView {
    id: string
    project_id: string
    category: 'isometricos' | 'planes_lineas' | 'otros'
    file_name: string
    file_url: string
    file_size: number | null
    uploaded_by: string
    created_at: string
    updated_at: string
}

// ===== ISOMETRICS =====

/**
 * Isometric - Reference to an isometric drawing with lifecycle metadata
 */
export interface Isometric {
    id: string
    project_id: string
    company_id: string
    isometric_id: string  // Business ID (e.g., "ISO-001")
    rev_id: string  // Revision (e.g., "R0", "R1")
    file_id: string | null  // FK to master_views
    created_at: string
    updated_at: string
}

// ===== SPOOLS =====

/**
 * Spool - A physical assembly unit referenced by an isometric
 */
export interface Spool {
    id: string
    project_id: string
    company_id: string
    spool_id: string  // Business ID (e.g., "SP-001")
    isometric_id: string  // FK to isometrics
    status_id: string | null  // FK to spool_statuses
    created_at: string
    updated_at: string
}

/**
 * SpoolStatus - Configurable spool workflow statuses per company
 */
export interface SpoolStatus {
    id: string
    company_id: string
    name: string  // E.g., "Fabricación", "Listo para Montaje"
    color: string  // HEX color for UI
    sequence: number  // Order in workflow
    is_initial: boolean  // True for starting state
    is_final: boolean  // True for terminal state
    created_at: string
    updated_at: string
}

// ===== FABRICATION TRACKING =====

/**
 * FabricationEvent - Records progress in the fabrication workflow
 */
export interface FabricationEvent {
    id: string
    spool_id: string
    status_id: string  // FK to spool_statuses
    notes: string | null
    created_by: string
    created_at: string
}

// ===== WELDS =====

/**
 * WeldType - Types of welds (configurable per company)
 */
export interface WeldType {
    id: string
    company_id: string
    name: string  // E.g., "BW" (Butt Weld), "SW" (Socket Weld)
    created_at: string
}

/**
 * Weld - Represents a weld joint in a spool
 */
export interface Weld {
    id: string
    spool_id: string
    weld_id: string  // Business ID (e.g., "W-001")
    weld_type_id: string  // FK to weld_types
    created_at: string
}

/**
 * WeldQualityTest - Quality control test for a weld
 */
export interface WeldQualityTest {
    id: string
    weld_id: string
    test_type: 'visual' | 'radiography' | 'ultrasonic' | 'penetrant' | 'magnetic'
    result: 'passed' | 'failed' | 'pending'
    notes: string | null
    tested_by: string
    created_at: string
}

// ===== DISPATCH TRACKING =====

/**
 * DispatchEvent - Tracks when spools are dispatched to site
 */
export interface DispatchEvent {
    id: string
    spool_id: string
    dispatch_date: string
    destination: string | null
    notes: string | null
    created_by: string
    created_at: string
}

// ===== REVISIONS (CHANGE MANAGEMENT) =====

/**
 * EntityType - Types of entities that can have revisions
 */
export type RevisionEntityType = 'isometric' | 'line' | 'spool'

/**
 * RevisionStatusEnum
 */
export enum RevisionStatusEnum {
    PENDING_REVIEW = 'pending_review',
    ACTIVE = 'active',
    SUPERSEDED = 'superseded',
    ARCHIVED = 'archived'
}

/**
 * RevisionOccupancyEnum
 */
export enum RevisionOccupancyEnum {
    CURRENT = 'CURRENT',
    ARCHIVED = 'ARCHIVED'
}

/**
 * RevisionEventTypeEnum
 */
export type RevisionEventTypeEnum = 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'APPROVED' | 'APPLIED' | 'REJECTED' | 'DRAFT' | 'VIGENTE' | 'PENDING' | 'CREATION' | 'FILE_UPLOAD' | 'STATUS_CHANGE' | 'APPROVAL' | 'REJECTION' | 'IMPACT_DETECTED' | 'RESOLVED'

/**
 * ImpactTypeEnum
 */
export enum ImpactTypeEnum {
    MAJOR_DIMENSION_CHANGE = 'MAJOR_DIMENSION_CHANGE',
    MINOR_CORRECTION = 'MINOR_CORRECTION',
    MATERIAL_SUBSTITUTION = 'MATERIAL_SUBSTITUTION',
    SPEC_CLARIFICATION = 'SPEC_CLARIFICATION',
    MODIFIED = 'MODIFIED'
}

/**
 * ImpactSeverityEnum
 */
export enum ImpactSeverityEnum {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

/**
 * ResolutionTypeEnum
 */
export enum ResolutionTypeEnum {
    INCORPORATE_AS_IS = 'INCORPORATE_AS_IS',
    MODIFY_EXISTING = 'MODIFY_EXISTING',
    REWORK_REQUIRED = 'REWORK_REQUIRED',
    SCRAP_REPLACE = 'SCRAP_REPLACE'
}

export enum DataStatusEnum {
    VACIO = 'VACIO',
    CARGADO = 'CARGADO',
    ERROR = 'ERROR',
    COMPLETO = 'COMPLETO',
    INCOMPLETO = 'INCOMPLETO'
}

export enum MaterialStatusEnum {
    NO_REQUERIDO = 'NO_REQUERIDO',
    PENDIENTE = 'PENDIENTE',
    COMPLETO = 'COMPLETO',
    DISPONIBLE = 'DISPONIBLE',
    PARCIAL = 'PARCIAL',
    CRITICO = 'CRITICO'
}

/**
 * Revision - Tracks revisions to isometrics, lines, spools, etc.
 */
export interface Revision {
    id: string
    project_id: string
    company_id: string
    rev_id: string  // Business ID (e.g., "R1", "R2")
    entity_type: RevisionEntityType
    entity_id: string  // FK to isometrics, lines, spools, etc.
    status: RevisionStatusEnum
    occupancy: RevisionOccupancyEnum
    description: string | null
    created_by: string
    created_at: string
    updated_at: string
}

export interface RevisionEvent {
    id: string
    revision_id: string
    project_id: string  // Auto-filled by trigger from engineering_revisions
    company_id: string  // Auto-filled by trigger from engineering_revisions
    event_type: RevisionEventTypeEnum
    payload: Record<string, any> | null
    created_by: string
    created_at: string
}

export interface RevisionImpact {
    id: string
    revision_id: string
    project_id: string  // Auto-filled by trigger from engineering_revisions
    company_id: string  // Auto-filled by trigger from engineering_revisions
    impact_type: string // Relaxed from ImpactTypeEnum to string
    affected_entity_type: string // Relaxed from specific string literals
    affected_entity_id: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL' | string // Relaxed
    resolution_type?: string | null // Relaxed from ResolutionTypeEnum
    resolution_notes?: string | null
    resolved_by?: string | null
    resolved_at?: string | null
    created_at: string
    updated_at: string
}

// Helper types for revision workflow
export interface CreateRevisionParams {
    project_id: string
    company_id: string
    rev_id: string
    entity_type: string
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
    specialty_id?: string
    notes?: string
    items: {
        material_spec: string
        quantity_requested: number
        target_entity_id?: string
        target_entity_type?: string
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

// ===== PROCUREMENT / MATERIALS =====

/**
 * MaterialRequestTypeEnum - Type of material request
 */
export enum MaterialRequestTypeEnum {
    CLIENT_MIR = 'CLIENT_MIR',
    CONTRACTOR_PO = 'CONTRACTOR_PO',
    PURCHASE = 'PURCHASE',
    WAREHOUSE = 'WAREHOUSE',
    TRANSFER = 'TRANSFER'
}

/**
 * RequestStatusEnum - Status of material request
 */
export enum RequestStatusEnum {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED', // Added
    SENT = 'SENT', // Added
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED', // Added
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
    PARTIAL = 'PARTIAL', // Added alias
    FULLY_RECEIVED = 'FULLY_RECEIVED',
    COMPLETED = 'COMPLETED', // Added alias
    CANCELLED = 'CANCELLED'
}

/**
 * MaterialCatalog - Company-specific material catalog
 */
export interface MaterialCatalog {
    id: string
    company_id: string
    part_group: string | null
    spec_code: string | null
    size_1: string | null
    size_2: string | null
    size_3: string | null
    size_4: string | null
    sch: string | null
    description: string
    unit: string | null
    created_at: string
    updated_at: string
}

/**
 * MaterialRequest - Request for materials (purchase/warehouse/transfer)
 */
export interface MaterialRequest {
    id: string
    project_id: string
    company_id: string
    specialty_id?: string
    request_number?: string
    request_type: MaterialRequestTypeEnum
    status: RequestStatusEnum
    requested_date?: string
    eta_date?: string
    notes: string | null
    created_by: string
    approved_by: string | null
    approved_at: string | null
    created_at: string
    updated_at: string
}

/**
 * MaterialRequestItem - Line item in a material request
 */
export interface MaterialRequestItem {
    id: string
    request_id: string
    material_spec: string
    quantity_requested: number
    quantity_received: number
    target_entity_id?: string
    target_entity_type?: string
    spool_id: string | null
    isometric_id: string | null
    notes: string | null
    created_at: string
}

/**
 * MaterialReceipt - Receipt of materials
 */
export interface MaterialReceipt {
    id: string
    request_id: string
    delivery_note: string | null
    received_by: string
    received_at: string
    created_at: string
}

/**
 * MaterialReceiptItem - Line item in a material receipt
 */
export interface MaterialReceiptItem {
    id: string
    receipt_id: string
    request_item_id: string
    quantity: number
    target_entity_id?: string
    target_entity_type?: string
    batch_id: string | null
    notes: string | null
    created_at: string
}

// ===== API RESPONSES =====

export interface ApiResponse<T = any> {
    success: boolean
    message?: string
    data?: T
    error?: any
}

// ===== STRUCTURE MODELS =====

export interface StructureModel {
    id: string
    project_id: string
    name: string
    area?: string
    model_url: string
    position_x?: number
    position_y?: number
    position_z?: number
    rotation_x?: number
    rotation_y?: number
    rotation_z?: number
    scale_x?: number
    scale_y?: number
    scale_z?: number
    metadata?: any
    created_at: string
}

// ===== ENGINEERING REVISIONS =====

export interface EngineeringRevision {
    id: string
    isometric_id: string
    project_id: string
    company_id: string
    rev_code: string
    revision_status: string
    transmittal?: string
    transmittal_code?: string
    transmittal_date?: string
    release_date?: string
    announcement_date?: string
    has_production_data?: boolean
    spools_loaded?: boolean
    welds_loaded?: boolean
    mto_loaded?: boolean
    bolted_joints_loaded?: boolean
    data_status: string // 'VACIO' | 'CARGADO' | 'ERROR'
    material_status: string // 'NO_REQUERIDO' | 'PENDIENTE' | 'COMPLETO'
    requires_joints?: boolean
    created_by?: string
    created_at: string
    updated_at?: string
    glb_model_url?: string
    pdf_url?: string
    model_data?: any
    iso_number?: string // Joined from isometrics
    welds_count?: number // Counted
    spools_count?: number // Counted
}

// ===== WELD TYPES =====

export interface WeldTypeConfig {
    id: string
    project_id: string
    company_id: string
    type_code: string
    type_name_es: string
    type_name_en?: string | null
    requires_welder: boolean
    icon: string
    color: string
    created_at: string
    updated_at: string
}

// ===== ROLE TYPES =====

export interface CreateCompanyRoleParams {
    company_id: string
    name: string
    description?: string
    color: string
    base_role: 'admin' | 'supervisor' | 'worker'
    permissions: RolePermissions
}

export type UpdateCompanyRoleParams = Partial<Omit<CreateCompanyRoleParams, 'company_id'>>

export interface CompanyRoleWithStats extends CompanyRole {
    members_count: number
}

export interface MemberWithFunctionalRole extends Member {
    company_roles: CompanyRole | null
}

export interface MemberWithRelations extends Member {
    user: any
    project: any
    company: any
    company_role: CompanyRole | null
}

// ===== SPATIAL TYPES =====

export interface SpatialData {
    x: number
    y: number
    z: number
}

export interface SpatialTransform {
    position: SpatialData
    rotation: SpatialData
    scale: SpatialData
}

export interface MaterialInventory {
    id: string
    project_id: string
    company_id: string
    material_spec: string
    quantity_available: number
    quantity_allocated: number
    location: string
    created_at: string
    updated_at: string
}




