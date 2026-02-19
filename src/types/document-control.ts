/**
 * Document Control Module Types
 * Mirrors the document_control_foundation migration schema
 */

// ===== ENUMS =====

export const DocumentStatus = {
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED',
    ON_HOLD: 'ON_HOLD'
} as const
export type DocumentStatusType = typeof DocumentStatus[keyof typeof DocumentStatus]

export const RevisionStatus = {
    DRAFT: 'DRAFT',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    SUPERSEDED: 'SUPERSEDED'
} as const
export type RevisionStatusType = typeof RevisionStatus[keyof typeof RevisionStatus]

export const TransmittalStatus = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    RECEIVED: 'RECEIVED',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
    PENDING_PROCESS: 'PENDING_PROCESS',
    PROCESSED: 'PROCESSED'
} as const
export type TransmittalStatusType = typeof TransmittalStatus[keyof typeof TransmittalStatus]

export const TransmittalPurpose = {
    FOR_APPROVAL: 'FOR_APPROVAL',
    FOR_INFORMATION: 'FOR_INFORMATION',
    FOR_CONSTRUCTION: 'FOR_CONSTRUCTION',
    AS_BUILT: 'AS_BUILT'
} as const
export type TransmittalPurposeType = typeof TransmittalPurpose[keyof typeof TransmittalPurpose]

export const TransmittalDirection = {
    INCOMING: 'INCOMING',
    OUTGOING: 'OUTGOING'
} as const
export type TransmittalDirectionType = typeof TransmittalDirection[keyof typeof TransmittalDirection]

export const DocumentEventType = {
    CREATED: 'CREATED',
    REVISION_UPLOADED: 'REVISION_UPLOADED',
    STATUS_CHANGED: 'STATUS_CHANGED',
    TRANSMITTED: 'TRANSMITTED',
    FROZEN: 'FROZEN',
    UNFROZEN: 'UNFROZEN'
} as const
export type DocumentEventTypeValue = typeof DocumentEventType[keyof typeof DocumentEventType]

// ===== ENTITIES =====

export interface DocumentType {
    id: string
    company_id: string
    name: string
    code: string
    description: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ProjectArea {
    id: string
    project_id: string
    company_id: string
    code: string
    name: string | null
    description: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ProjectDocumentConfig {
    id: string
    project_id: string
    company_id: string
    coding_pattern: string
    next_sequence: number
    is_frozen: boolean
    frozen_at: string | null
    frozen_by: string | null
    created_at: string
    updated_at: string
}

export interface DocumentMaster {
    id: string
    project_id: string
    company_id: string
    document_type_id: string
    specialty_id: string | null
    area_id: string | null         // Physical plant/project area (AWP)
    document_code: string
    title: string
    description: string | null
    current_revision_id: string | null
    status: DocumentStatusType
    created_by: string
    created_at: string
    updated_at: string
    // Joined fields
    document_type?: DocumentType
    specialty?: { id: string; name: string; code: string }
    area?: { id: string; name: string | null; code: string }
    current_revision?: DocumentRevision
    revisions_count?: number
}

export interface DocumentRevision {
    id: string
    document_id: string
    project_id: string
    company_id: string
    rev_code: string
    status: RevisionStatusType
    file_url: string | null
    file_name: string | null
    file_size: number | null
    notes: string | null
    reviewed_by: string | null
    reviewed_at: string | null
    created_by: string
    created_at: string
    updated_at: string
    // Joined fields
    creator?: { full_name: string | null; email: string }
    reviewer?: { full_name: string | null; email: string }
}

export interface Transmittal {
    id: string
    project_id: string
    company_id: string
    transmittal_code: string
    title: string | null
    recipient: string | null
    notes: string | null
    status: TransmittalStatusType
    direction: TransmittalDirectionType
    package_url: string | null
    manifest_url: string | null
    sent_at: string | null
    sent_by: string | null
    created_by: string
    created_at: string
    updated_at: string
    // Joined fields
    items_count?: number
    items?: TransmittalItem[]
}

export interface TransmittalItem {
    id: string
    transmittal_id: string
    document_revision_id: string
    purpose: TransmittalPurposeType
    created_at: string
    // Joined fields
    document_revision?: DocumentRevision & {
        document_master?: DocumentMaster
    }
}

export interface DocumentEvent {
    id: string
    document_id: string
    revision_id: string | null
    project_id: string
    company_id: string
    event_type: DocumentEventTypeValue
    payload: Record<string, any>
    created_by: string
    created_at: string
    // Joined fields
    creator?: { full_name: string | null; email: string }
}

// ===== PARAMS =====

export interface CreateDocumentParams {
    project_id: string
    company_id: string
    document_type_id: string
    specialty_id?: string | null
    area_id?: string | null
    title: string
    description?: string
    file_name?: string
    file_size?: number
}

export interface CreateRevisionParams {
    document_id: string
    rev_code: string
    file_url?: string
    file_name?: string
    file_size?: number
    notes?: string
}

export interface CreateTransmittalParams {
    project_id: string
    company_id: string
    title?: string
    recipient?: string
    notes?: string
    direction?: TransmittalDirectionType
    package_url?: string
    manifest_url?: string
    items: {
        document_revision_id: string
        purpose?: TransmittalPurposeType
    }[]
}

// ===== FILTERS =====

export interface DocumentFilters {
    document_type_id?: string
    specialty_id?: string
    area_id?: string
    status?: DocumentStatusType
    search?: string
}

// ===== KPI =====

export interface DocumentControlKPIs {
    total_documents: number
    pending_review: number
    approved_this_month: number
    transmittals_this_month: number
}
