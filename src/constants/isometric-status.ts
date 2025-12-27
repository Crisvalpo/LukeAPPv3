/**
 * ISOMETRIC STATUS CONSTANTS
 * 
 * 8-state system for tracking isometric lifecycle
 */

export const IsometricStatus = {
    // VIGENTE (Current/Active)
    VIGENTE: 'VIGENTE',
    VIGENTE_SPOOLEADO: 'VIGENTE_SPOOLEADO',

    // OBSOLETO (Superseded)
    OBSOLETO: 'OBSOLETO',
    OBSOLETO_SPOOLEADO: 'OBSOLETO_SPOOLEADO',

    // ELIMINADO (Deleted/Cancelled)
    ELIMINADO: 'ELIMINADO',
    ELIMINADO_SPOOLEADO: 'ELIMINADO_SPOOLEADO',

    // EXECUTION (Fabrication)
    EN_EJECUCION: 'EN_EJECUCION',
    TERMINADA: 'TERMINADA'
} as const

export type IsometricStatusType = typeof IsometricStatus[keyof typeof IsometricStatus]

/**
 * Status labels for UI (Spanish)
 */
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

/**
 * Status colors for UI
 */
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
 * Get next status when details are uploaded
 */
export function getSpooledStatus(currentStatus: IsometricStatusType): IsometricStatusType {
    const transitions: Partial<Record<IsometricStatusType, IsometricStatusType>> = {
        [IsometricStatus.VIGENTE]: IsometricStatus.VIGENTE_SPOOLEADO,
        [IsometricStatus.OBSOLETO]: IsometricStatus.OBSOLETO_SPOOLEADO,
        [IsometricStatus.ELIMINADO]: IsometricStatus.ELIMINADO_SPOOLEADO
    }

    return transitions[currentStatus] || currentStatus
}

/**
 * Get status when isometric becomes obsolete
 */
export function getObsoleteStatus(currentStatus: IsometricStatusType): IsometricStatusType {
    // If already spooleado, maintain that info
    if (currentStatus === IsometricStatus.VIGENTE_SPOOLEADO) {
        return IsometricStatus.OBSOLETO_SPOOLEADO
    }
    return IsometricStatus.OBSOLETO
}

/**
 * Check if status indicates isometric has details loaded
 */
export function isSpooleado(status: IsometricStatusType): boolean {
    return status.includes('SPOOLEADO')
}

/**
 * Check if status is VIGENTE (any variant)
 */
export function isVigente(status: IsometricStatusType): boolean {
    return status.startsWith('VIGENTE')
}
