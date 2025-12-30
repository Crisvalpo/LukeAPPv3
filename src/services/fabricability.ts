/**
 * Fabricability Service
 * FASE 2A - Material Control Foundation
 * 
 * Determines if a revision is ready for fabrication based on:
 * 1. Data Status: Are all spools in MTO complete?
 * 2. Material Status: Is material available?
 */

import { createClient } from '@/lib/supabase/client'

// ============================================
// TYPES
// ============================================

export type DataStatus = 'VACIO' | 'EN_DESARROLLO' | 'COMPLETO' | 'BLOQUEADO'
export type MaterialStatus =
    | 'NO_REQUERIDO'      // Client-provided material
    | 'PENDIENTE_COMPRA'  // No MIR/PO created yet
    | 'PENDIENTE_APROBACION' // MIR submitted, awaiting approval
    | 'EN_TRANSITO'       // Approved, not received
    | 'DISPONIBLE'        // In inventory
    | 'ASIGNADO'          // Allocated to spools

export interface RevisionStatus {
    revision_id: string
    data_status: DataStatus
    material_status: MaterialStatus
    is_fabricable: boolean
    blocking_reason?: string
}

export interface IsometricWithRevision {
    id: string
    iso_number: string
    current_revision_id: string | null
    revision_status?: string
}

// ============================================
// DATA STATUS CALCULATION
// ============================================

/**
 * Calculate data completeness for a revision
 * Logic:
 * - VACIO: No spools or no MTO items
 * - EN_DESARROLLO: Some spools have MTO, others don't
 * - COMPLETO: All spools have MTO items
 * - BLOQUEADO: Revision is superseded (not VIGENTE)
 */
export async function calculateDataStatus(
    revisionId: string
): Promise<DataStatus> {
    const supabase = createClient()

    // 1. Check if revision is superseded
    const { data: revision } = await supabase
        .from('engineering_revisions')
        .select('revision_status')
        .eq('id', revisionId)
        .single()

    if (!revision || revision.revision_status !== 'VIGENTE') {
        return 'BLOQUEADO'
    }

    // 2. Get all spools for this revision
    const { data: spools } = await supabase
        .from('spools')
        .select('id')
        .eq('revision_id', revisionId)

    if (!spools || spools.length === 0) {
        return 'VACIO'
    }

    // 3. Count spools with MTO items
    const spoolIds = spools.map(s => s.id)
    const { data: mtoItems } = await supabase
        .from('spools_mto')
        .select('spool_id')
        .in('spool_id', spoolIds)

    if (!mtoItems || mtoItems.length === 0) {
        return 'VACIO'
    }

    // 4. Get unique spools that have MTO
    const spoolsWithMTO = new Set(mtoItems.map(item => item.spool_id))

    // All spools have MTO?
    if (spoolsWithMTO.size === spools.length) {
        return 'COMPLETO'
    }

    // Some spools have MTO, others don't
    return 'EN_DESARROLLO'
}

// ============================================
// MATERIAL STATUS CALCULATION
// ============================================

/**
 * Calculate material availability for a revision
 * 
 * SIMPLIFIED VERSION (Phase 1):
 * - For now, defaults to NO_REQUERIDO if no material requests exist
 * - Future: Check material_requests table for actual status
 */
export async function calculateMaterialStatus(
    revisionId: string
): Promise<MaterialStatus> {
    const supabase = createClient()

    // Get isometric for this revision to check ownership
    const { data: revision } = await supabase
        .from('engineering_revisions')
        .select('isometric_id')
        .eq('id', revisionId)
        .single()

    if (!revision) {
        return 'NO_REQUERIDO'
    }

    // TODO: Check material_requests table when implemented
    // For now, default to NO_REQUERIDO (assuming client-provided)
    // This will be enhanced in Sprint 5 when we add MIR tracking

    return 'NO_REQUERIDO'
}

// ============================================
// FABRICABILITY CHECK
// ============================================

/**
 * Determine if a revision is fabricable
 * 
 * A revision is fabricable if ALL of:
 * 1. Status is VIGENTE (not superseded)
 * 2. Data is COMPLETO (all MTO populated)
 * 3. Material is DISPONIBLE or ASIGNADO (or NO_REQUERIDO)
 */
export async function isFabricable(
    revisionId: string
): Promise<{ fabricable: boolean; reason?: string }> {
    const supabase = createClient()

    // Get current status from database
    const { data: revision } = await supabase
        .from('engineering_revisions')
        .select('revision_status, data_status, material_status')
        .eq('id', revisionId)
        .single()

    if (!revision) {
        return { fabricable: false, reason: 'Revisión no encontrada' }
    }

    // Check revision status
    if (revision.revision_status !== 'VIGENTE') {
        return { fabricable: false, reason: 'Revisión no vigente (obsoleta)' }
    }

    // Check data completeness
    if (revision.data_status !== 'COMPLETO') {
        return { fabricable: false, reason: `Datos incompletos (${revision.data_status})` }
    }

    // Check material availability
    const materialOk = ['NO_REQUERIDO', 'DISPONIBLE', 'ASIGNADO'].includes(
        revision.material_status
    )

    if (!materialOk) {
        return { fabricable: false, reason: `Material no disponible (${revision.material_status})` }
    }

    return { fabricable: true }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Calculate and update status for all revisions in a project
 * This should be called periodically or triggered by events
 */
export async function updateAllRevisionStatuses(
    projectId: string
): Promise<{ updated: number; errors: number }> {
    const supabase = createClient()

    const { data: revisions } = await supabase
        .from('engineering_revisions')
        .select('id')
        .eq('project_id', projectId)

    if (!revisions) {
        return { updated: 0, errors: 0 }
    }

    let updated = 0
    let errors = 0

    for (const revision of revisions) {
        try {
            const dataStatus = await calculateDataStatus(revision.id)
            const materialStatus = await calculateMaterialStatus(revision.id)

            await supabase
                .from('engineering_revisions')
                .update({
                    data_status: dataStatus,
                    material_status: materialStatus
                })
                .eq('id', revision.id)

            updated++
        } catch (error) {
            console.error(`Error updating revision ${revision.id}:`, error)
            errors++
        }
    }

    return { updated, errors }
}

/**
 * Get fabricability summary for a project
 * Returns counts by fabricability status
 */
export async function getFabricabilitySummary(projectId: string) {
    const supabase = createClient()

    const { data: revisions } = await supabase
        .from('engineering_revisions')
        .select('id, revision_status, data_status, material_status')
        .eq('project_id', projectId)

    if (!revisions) {
        return {
            total: 0,
            fabricable: 0,
            blocked_by_data: 0,
            blocked_by_material: 0,
            obsolete: 0
        }
    }

    let fabricable = 0
    let blockedByData = 0
    let blockedByMaterial = 0
    let obsolete = 0

    for (const rev of revisions) {
        if (rev.revision_status !== 'VIGENTE') {
            obsolete++
            continue
        }

        if (rev.data_status !== 'COMPLETO') {
            blockedByData++
            continue
        }

        const materialOk = ['NO_REQUERIDO', 'DISPONIBLE', 'ASIGNADO'].includes(
            rev.material_status
        )

        if (!materialOk) {
            blockedByMaterial++
            continue
        }

        fabricable++
    }

    return {
        total: revisions.length,
        fabricable,
        blocked_by_data: blockedByData,
        blocked_by_material: blockedByMaterial,
        obsolete
    }
}
