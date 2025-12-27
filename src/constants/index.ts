/**
 * Application Constants
 */

// ===== STATUS LABELS (UI) =====

export const PROJECT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    planning: { label: 'Planificación', color: '#94a3b8' },
    active: { label: 'Activo', color: '#4ade80' },
    on_hold: { label: 'En Pausa', color: '#fb923c' },
    completed: { label: 'Completado', color: '#60a5fa' },
    cancelled: { label: 'Cancelado', color: '#f87171' }
}

export const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    founder: 'Founder',
    admin: 'Administrador',
    supervisor: 'Supervisor',
    worker: 'Trabajador'
}

// ===== ROUTES =====

export const ROUTES = {
    // Public
    HOME: '/',
    LANDING: '/',

    // Auth
    ACCEPT_INVITATION: (token: string) => `/invitations/accept/${token}`,

    // Staff (Super Admin)
    STAFF_DASHBOARD: '/staff',
    STAFF_COMPANIES: '/staff/companies',
    STAFF_COMPANY_DETAIL: (id: string) => `/staff/companies/${id}`,
    STAFF_PROJECTS: '/staff/projects',
    STAFF_USERS: '/staff/users',
    STAFF_INVITATIONS: '/staff/invitations',

    // Founder (Company Level)
    FOUNDER_DASHBOARD: '/founder',
    FOUNDER_PROJECTS: '/founder/projects',
    FOUNDER_PROJECT_NEW: '/founder/projects/new',
    FOUNDER_PROJECT_DETAIL: (id: string) => `/founder/projects/${id}`,
    FOUNDER_INVITATIONS: '/founder/invitations',
    FOUNDER_COMPANY: '/founder/company',

    // Admin (Project Level)
    ADMIN_DASHBOARD: '/admin',

    // Lobby
    LOBBY: '/lobby'
} as const

// ===== VALIDATION =====

export const VALIDATION = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_PASSWORD_LENGTH: 8,
    MAX_COMPANY_NAME_LENGTH: 100,
    MAX_PROJECT_NAME_LENGTH: 100,
    MAX_PROJECT_CODE_LENGTH: 20,
    MAX_DESCRIPTION_LENGTH: 500
} as const

// ===== UI CONSTANTS =====

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
} as const

export const COLORS = {
    PRIMARY: '#3b82f6',
    SUCCESS: '#4ade80',
    WARNING: '#fb923c',
    ERROR: '#f87171',
    INFO: '#60a5fa'
} as const

// ===== PHASE 2: REVISION SYSTEM LABELS =====

export const REVISION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Borrador', color: '#94a3b8' },
    PENDING: { label: 'Pendiente', color: '#fb923c' },
    APPROVED: { label: 'Aprobada', color: '#4ade80' },
    APPLIED: { label: 'Aplicada', color: '#60a5fa' },
    REJECTED: { label: 'Rechazada', color: '#f87171' }
}

export const IMPACT_SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Bajo', color: '#4ade80' },
    MEDIUM: { label: 'Medio', color: '#fb923c' },
    HIGH: { label: 'Alto', color: '#f59e0b' },
    CRITICAL: { label: 'Crítico', color: '#f87171' }
}

export const RESOLUTION_TYPE_LABELS: Record<string, string> = {
    REWORK: 'Rehacer Trabajo',
    MATERIAL_RETURN: 'Devolver Material',
    FREE_JOINT: 'Unión Gratis (Estratégico)',
    TECHNICAL_EXCEPTION: 'Excepción Técnica',
    CLIENT_APPROVAL: 'Aprobación Cliente'
}

// ===== MODULE LABELS (For Permissions) =====

export const MODULE_LABELS: Record<string, string> = {
    // Engineering
    revisiones: 'Revisiones de Ingeniería',
    isometricos: 'Isométricos',
    documentos: 'Control de Documentos',

    // Field
    spools: 'Gestión de Spools',
    qa: 'Control de Calidad',
    logistica: 'Logística',
    almacen: 'Almacén/Pañol',

    // Management
    reportes: 'Reportes',
    personal: 'Gestión de Personal'
}

export const FABRICATION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: '#94a3b8' },
    FABRICATED: { label: 'Fabricado', color: '#fb923c' },
    DISPATCHED: { label: 'Despachado', color: '#3b82f6' },
    INSTALLED: { label: 'Instalado', color: '#4ade80' }
}
