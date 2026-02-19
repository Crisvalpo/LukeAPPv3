/**
 * ISOMETRIC STATUS CONSTANTS
 * 
 * Dual-field system for tracking isometric lifecycle:
 * - revision_status: Document lifecycle (VIGENTE, OBSOLETA, ELIMINADA)
 * - spooling_status: Process status (SIN_SPOOLEAR, EN_PROCESO, SPOOLEADO, SPOOLEADO_MANUAL)
 * 
 * The combined UI label is computed from both fields.
 */

// ===== REVISION STATUS (Document Lifecycle) =====

export const RevisionStatus = {
    VIGENTE: 'VIGENTE',
    OBSOLETA: 'OBSOLETA',
    ELIMINADA: 'ELIMINADA'
} as const

export type RevisionStatusType = typeof RevisionStatus[keyof typeof RevisionStatus]

export const RevisionStatusLabels: Record<RevisionStatusType, string> = {
    [RevisionStatus.VIGENTE]: 'Vigente',
    [RevisionStatus.OBSOLETA]: 'Obsoleta',
    [RevisionStatus.ELIMINADA]: 'Eliminada'
}

export const RevisionStatusColors: Record<RevisionStatusType, string> = {
    [RevisionStatus.VIGENTE]: 'green',
    [RevisionStatus.OBSOLETA]: 'gray',
    [RevisionStatus.ELIMINADA]: 'red'
}

// ===== SPOOLING STATUS (Process Status) =====

export const SpoolingStatus = {
    SIN_SPOOLEAR: 'SIN_SPOOLEAR',
    EN_PROCESO: 'EN_PROCESO',
    SPOOLEADO: 'SPOOLEADO',
    SPOOLEADO_MANUAL: 'SPOOLEADO_MANUAL'
} as const

export type SpoolingStatusType = typeof SpoolingStatus[keyof typeof SpoolingStatus]

export const SpoolingStatusLabels: Record<SpoolingStatusType, string> = {
    [SpoolingStatus.SIN_SPOOLEAR]: 'Sin Spoolear',
    [SpoolingStatus.EN_PROCESO]: 'En Proceso',
    [SpoolingStatus.SPOOLEADO]: 'Spooleado',
    [SpoolingStatus.SPOOLEADO_MANUAL]: 'Spooleado Manual'
}

export const SpoolingStatusColors: Record<SpoolingStatusType, string> = {
    [SpoolingStatus.SIN_SPOOLEAR]: 'yellow',
    [SpoolingStatus.EN_PROCESO]: 'blue',
    [SpoolingStatus.SPOOLEADO]: 'green',
    [SpoolingStatus.SPOOLEADO_MANUAL]: 'teal'
}

// ===== COMBINED LABEL (for UI display) =====

export function getCombinedStatusLabel(
    revisionStatus: RevisionStatusType,
    spoolingStatus: SpoolingStatusType
): string {
    const revLabel = RevisionStatusLabels[revisionStatus] || revisionStatus
    const spoolLabel = SpoolingStatusLabels[spoolingStatus] || spoolingStatus

    if (spoolingStatus === SpoolingStatus.SIN_SPOOLEAR) {
        return `${revLabel} Sin Spoolear`
    }
    if (spoolingStatus === SpoolingStatus.EN_PROCESO) {
        return `${revLabel} En Proceso`
    }
    if (spoolingStatus === SpoolingStatus.SPOOLEADO_MANUAL) {
        return `${revLabel} Spooleada (Manual)`
    }
    // SPOOLEADO
    return `${revLabel} Spooleada`
}

export function getCombinedStatusIcon(
    revisionStatus: RevisionStatusType,
    spoolingStatus: SpoolingStatusType
): string {
    if (revisionStatus === RevisionStatus.ELIMINADA) return '🗑️'
    if (revisionStatus === RevisionStatus.OBSOLETA) {
        if (spoolingStatus === SpoolingStatus.SPOOLEADO || spoolingStatus === SpoolingStatus.SPOOLEADO_MANUAL) return '📦'
        return '📦'
    }
    // VIGENTE
    if (spoolingStatus === SpoolingStatus.SPOOLEADO || spoolingStatus === SpoolingStatus.SPOOLEADO_MANUAL) return '✅'
    if (spoolingStatus === SpoolingStatus.EN_PROCESO) return '🔄'
    return '⏳'
}

// ===== LEGACY COMPAT (8-state system → dual system) =====
// These map the old combined status values to the new dual fields

export const IsometricStatus = {
    VIGENTE: 'VIGENTE',
    VIGENTE_SPOOLEADO: 'VIGENTE_SPOOLEADO',
    OBSOLETO: 'OBSOLETO',
    OBSOLETO_SPOOLEADO: 'OBSOLETO_SPOOLEADO',
    ELIMINADO: 'ELIMINADO',
    ELIMINADO_SPOOLEADO: 'ELIMINADO_SPOOLEADO',
    EN_EJECUCION: 'EN_EJECUCION',
    TERMINADA: 'TERMINADA'
} as const

export type IsometricStatusType = typeof IsometricStatus[keyof typeof IsometricStatus]

/**
 * Convert legacy status to dual-field values
 */
export function legacyToDualStatus(legacyStatus: string): {
    revision_status: RevisionStatusType
    spooling_status: SpoolingStatusType
} {
    switch (legacyStatus) {
        case 'VIGENTE':
            return { revision_status: RevisionStatus.VIGENTE, spooling_status: SpoolingStatus.SIN_SPOOLEAR }
        case 'VIGENTE_SPOOLEADO':
            return { revision_status: RevisionStatus.VIGENTE, spooling_status: SpoolingStatus.SPOOLEADO }
        case 'OBSOLETO':
        case 'OBSOLETA':
            return { revision_status: RevisionStatus.OBSOLETA, spooling_status: SpoolingStatus.SIN_SPOOLEAR }
        case 'OBSOLETO_SPOOLEADO':
        case 'OBSOLETA_SPOOLEADA':
            return { revision_status: RevisionStatus.OBSOLETA, spooling_status: SpoolingStatus.SPOOLEADO }
        case 'ELIMINADO':
        case 'ELIMINADA':
            return { revision_status: RevisionStatus.ELIMINADA, spooling_status: SpoolingStatus.SIN_SPOOLEAR }
        case 'ELIMINADO_SPOOLEADO':
        case 'ELIMINADA_SPOOLEADA':
            return { revision_status: RevisionStatus.ELIMINADA, spooling_status: SpoolingStatus.SPOOLEADO }
        case 'EN_EJECUCION':
        case 'TERMINADA':
            return { revision_status: RevisionStatus.VIGENTE, spooling_status: SpoolingStatus.SPOOLEADO }
        default:
            return { revision_status: RevisionStatus.VIGENTE, spooling_status: SpoolingStatus.SIN_SPOOLEAR }
    }
}

// ===== TRANSITION HELPERS =====

/**
 * Get spooling status after details are uploaded
 */
export function getSpooledStatus(currentSpooling: SpoolingStatusType): SpoolingStatusType {
    if (currentSpooling === SpoolingStatus.SIN_SPOOLEAR || currentSpooling === SpoolingStatus.EN_PROCESO) {
        return SpoolingStatus.SPOOLEADO
    }
    return currentSpooling
}

/**
 * Check if isometric has been spooled (any method)
 */
export function isSpooleado(spoolingStatus: SpoolingStatusType): boolean {
    return spoolingStatus === SpoolingStatus.SPOOLEADO || spoolingStatus === SpoolingStatus.SPOOLEADO_MANUAL
}

/**
 * Check if revision is current/active
 */
export function isVigente(revisionStatus: RevisionStatusType): boolean {
    return revisionStatus === RevisionStatus.VIGENTE
}

/**
 * Check if revision is obsolete
 */
export function isObsolete(revisionStatus: RevisionStatusType): boolean {
    return revisionStatus === RevisionStatus.OBSOLETA
}

/**
 * Check if revision is eliminated
 */
export function isEliminado(revisionStatus: RevisionStatusType): boolean {
    return revisionStatus === RevisionStatus.ELIMINADA
}

// Legacy labels for backward compatibility
export const StatusLabels: Record<IsometricStatusType, string> = {
    [IsometricStatus.VIGENTE]: '⏳ Vigente',
    [IsometricStatus.VIGENTE_SPOOLEADO]: '✅ Vigente Spooleado',
    [IsometricStatus.OBSOLETO]: '📦 Obsoleto',
    [IsometricStatus.OBSOLETO_SPOOLEADO]: '📦 Obsoleto (Spooleado)',
    [IsometricStatus.ELIMINADO]: '🗑️ Eliminado',
    [IsometricStatus.ELIMINADO_SPOOLEADO]: '🗑️ Eliminado (Spooleado)',
    [IsometricStatus.EN_EJECUCION]: '🔨 En Ejecución',
    [IsometricStatus.TERMINADA]: '✔️ Terminada'
}

export const StatusColors: Record<IsometricStatusType, string> = {
    [IsometricStatus.VIGENTE]: 'yellow',
    [IsometricStatus.VIGENTE_SPOOLEADO]: 'green',
    [IsometricStatus.OBSOLETO]: 'gray',
    [IsometricStatus.OBSOLETO_SPOOLEADO]: 'gray',
    [IsometricStatus.ELIMINADO]: 'red',
    [IsometricStatus.ELIMINADO_SPOOLEADO]: 'red',
    [IsometricStatus.EN_EJECUCION]: 'blue',
    [IsometricStatus.TERMINADA]: 'purple'
}

/**
 * Legacy: Get obsolete status when superseded
 */
export function getObsoleteStatus(currentStatus: IsometricStatusType): IsometricStatusType {
    if (currentStatus === IsometricStatus.VIGENTE_SPOOLEADO) {
        return IsometricStatus.OBSOLETO_SPOOLEADO
    }
    return IsometricStatus.OBSOLETO
}
