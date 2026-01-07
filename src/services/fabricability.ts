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
 * - VACIO: No spools or no welds
 * - EN_DESARROLLO: Some spools have welds, others don't
 * - COMPLETO: All spools have welds (technical data loaded)
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

    // 3. Check if ANY welds exist for this revision (technical data loaded)
    const { data: welds, count } = await supabase
        .from('spools_welds')
        .select('id', { count: 'exact', head: true })
        .eq('revision_id', revisionId)

    if (!count || count === 0) {
        return 'VACIO'
    }

    // 4. Data is complete (welds loaded = spools defined)
    // Note: We simplified this - if welds exist, we consider it COMPLETO
    // Future enhancement: could check if ALL spools have at least 1 weld
    return 'COMPLETO'
}

// ============================================
// MATERIAL STATUS CALCULATION
// ============================================

/**
 * Calculate material availability for a revision
 * 
 * Updated to query by revision_id instead of spool_id
 * since MTO items may not have spool_id populated
 */
export async function calculateMaterialStatus(
    revisionId: string
): Promise<MaterialStatus> {
    const supabase = createClient()

    // 1. Get MTO items for this revision directly
    const { data: mtoItems } = await supabase
        .from('spools_mto')
        .select('material_spec, quantity')
        .eq('revision_id', revisionId)

    if (!mtoItems || mtoItems.length === 0) return 'NO_REQUERIDO'

    // 2. Get revision project_id for inventory lookup
    const { data: revision } = await supabase
        .from('engineering_revisions')
        .select('project_id')
        .eq('id', revisionId)
        .single()

    if (!revision) return 'NO_REQUERIDO'

    // 3. Aggregate Requirements by material_spec
    const requirements = new Map<string, number>()
    mtoItems.forEach(item => {
        const current = requirements.get(item.material_spec) || 0
        requirements.set(item.material_spec, current + Number(item.quantity))
    })

    // 4. Check Inventory for each requirement
    const specs = Array.from(requirements.keys())
    const { data: inventory } = await supabase
        .from('material_inventory')
        .select('material_spec, quantity_available')
        .eq('project_id', revision.project_id)
        .in('material_spec', specs)

    const inventoryMap = new Map<string, number>()
    inventory?.forEach(item => {
        const current = inventoryMap.get(item.material_spec) || 0
        inventoryMap.set(item.material_spec, current + Number(item.quantity_available))
    })

    // Analyze gaps
    const missingSpecs: string[] = []

    for (const [spec, requiredQty] of requirements.entries()) {
        const available = inventoryMap.get(spec) || 0
        if (available < requiredQty) {
            missingSpecs.push(spec)
        }
    }

    // If no missing specs, we are ready!
    if (missingSpecs.length === 0) {
        return 'DISPONIBLE'
    }

    // 5. If missing items, check Request Status
    const { data: requestItems } = await supabase
        .from('material_request_items')
        .select(`
            material_spec,
            request:material_requests(status)
        `)
        .in('material_spec', missingSpecs)

    let allCoveredByRequests = true
    let minRequestStatusLevel = 3 // 0: None, 1: Draft/Submitted, 2: Approved/Partial

    for (const spec of missingSpecs) {
        const specRequests = requestItems?.filter((r: any) => r.material_spec === spec) || []

        if (specRequests.length === 0) {
            allCoveredByRequests = false
            break
        }

        const hasApproved = specRequests.some((r: any) => ['APPROVED', 'PARTIAL'].includes(r.request.status))
        const hasSubmitted = specRequests.some((r: any) => ['SUBMITTED'].includes(r.request.status))

        if (hasApproved) {
            // Good, this spec is en-route
        } else if (hasSubmitted) {
            minRequestStatusLevel = Math.min(minRequestStatusLevel, 1)
        } else {
            allCoveredByRequests = false
            break
        }
    }

    if (!allCoveredByRequests) return 'PENDIENTE_COMPRA'
    if (minRequestStatusLevel === 1) return 'PENDIENTE_APROBACION'

    return 'EN_TRANSITO'
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
// ============================================
// FABRICABILITY CHECK (GRANULAR)
// ============================================

export interface SpoolFabricability {
    spool_id: string
    spool_number: string
    is_fabricable: boolean
    missing_items: string[] // List of item_codes
}

export interface RevisionFabricabilityAnalysis {
    revision_id: string
    is_fully_fabricable: boolean
    total_spools: number
    fabricable_spools_count: number
    fabricable_spools: SpoolFabricability[]
    blocked_spools: SpoolFabricability[]
    blocking_reason?: string
}

/**
 * Detailed analysis of revision fabricability at the Spool level
 */
export async function analyzeRevisionFabricability(
    revisionId: string
): Promise<RevisionFabricabilityAnalysis> {
    const supabase = createClient()

    // 1. Get Project ID (needed for inventory scope)
    const { data: revision } = await supabase
        .from('engineering_revisions')
        .select('project_id, revision_status, data_status')
        .eq('id', revisionId)
        .single()

    if (!revision) {
        throw new Error('Revision not found')
    }

    if (revision.revision_status !== 'VIGENTE') {
        return {
            revision_id: revisionId,
            is_fully_fabricable: false,
            total_spools: 0,
            fabricable_spools_count: 0,
            fabricable_spools: [],
            blocked_spools: [],
            blocking_reason: 'Revisión Obsoleta'
        }
    }

    // 2. Get Spools
    const { data: spools } = await supabase
        .from('spools')
        .select('id, spool_number')
        .eq('revision_id', revisionId)

    if (!spools || spools.length === 0) {
        return {
            revision_id: revisionId,
            is_fully_fabricable: false,
            total_spools: 0,
            fabricable_spools_count: 0,
            fabricable_spools: [],
            blocked_spools: [],
            blocking_reason: 'Sin Spools definidos'
        }
    }

    // 3. Get All MTO Items for this Revision
    const { data: mtoItems } = await supabase
        .from('spools_mto')
        .select('spool_id, item_code, quantity, material_spec') // Assuming item_code maps to material_spec or we use material_spec directly
        .eq('revision_id', revisionId)

    if (!mtoItems || mtoItems.length === 0) {
        return {
            revision_id: revisionId,
            is_fully_fabricable: false,
            total_spools: spools.length,
            fabricable_spools_count: 0,
            fabricable_spools: [],
            blocked_spools: [],
            blocking_reason: 'Sin Materiales (MTO Empty)'
        }
    }

    // 4. Get Inventory for relevant items
    // We strictly use material_spec (or item_code if distinct). Assuming material_spec is the key.
    // Note: spools_mto schema has `item_code` and `material_spec` might not exist or be synonymous. 
    // Checking schema 0029: spools_mto has `item_code` but not `material_spec`?
    // Wait, let's verify. 0029 says: `item_code TEXT NOT NULL`.
    // 0027 inventory says: `material_spec TEXT NOT NULL`.
    // We assume item_code in MTO === material_spec in Inventory.
    const requiredSpecs = Array.from(new Set(mtoItems.map(i => i.item_code || i.material_spec)))

    const { data: inventory } = await supabase
        .from('material_inventory')
        .select('material_spec, quantity_available')
        .eq('project_id', revision.project_id)
        .in('material_spec', requiredSpecs)

    const inventoryMap = new Map<string, number>()
    inventory?.forEach(inv => {
        // Aggregate if multiple locations
        const current = inventoryMap.get(inv.material_spec) || 0
        inventoryMap.set(inv.material_spec, current + Number(inv.quantity_available))
    })

    // 5. Analyze each Spool
    const fabricableSpools: SpoolFabricability[] = []
    const blockedSpools: SpoolFabricability[] = []

    for (const spool of spools) {
        const spoolItems = mtoItems.filter(i => i.spool_id === spool.id)

        // Summarize logic:
        // A spool is fabricable if ALL its items are available in inventory.
        // NOTE: This logic is tricky with SHARED inventory. 
        // If 2 spools need 10m pipe each, and we have 15m total, both look "possible" individually,
        // but not simultaneously. 
        // For "Fabricability" status, we usually check "Potential". Allocation checks happen later.
        // OR we check: available >= required for this spool.

        const missingItems: string[] = []

        // Aggregate requirements for this spool
        const requirements = new Map<string, number>()
        spoolItems.forEach(item => {
            const spec = item.item_code || item.material_spec
            const current = requirements.get(spec) || 0
            requirements.set(spec, current + Number(item.quantity))
        })

        for (const [spec, qty] of requirements.entries()) {
            const available = inventoryMap.get(spec) || 0
            if (available < qty) {
                missingItems.push(spec)
            }
        }

        const result: SpoolFabricability = {
            spool_id: spool.id,
            spool_number: spool.spool_number,
            is_fabricable: missingItems.length === 0,
            missing_items: missingItems
        }

        if (result.is_fabricable) {
            fabricableSpools.push(result)
        } else {
            blockedSpools.push(result)
        }
    }

    return {
        revision_id: revisionId,
        is_fully_fabricable: blockedSpools.length === 0 && fabricableSpools.length > 0,
        total_spools: spools.length,
        fabricable_spools_count: fabricableSpools.length,
        fabricable_spools: fabricableSpools,
        blocked_spools: blockedSpools,
        blocking_reason: blockedSpools.length > 0 ? `${blockedSpools.length} Spools bloqueados` : undefined
    }
}

/**
 * Wrapper for simple boolean check (Backward Compatibility)
 */
export async function isFabricable(
    revisionId: string
): Promise<{ fabricable: boolean; reason?: string }> {
    const analysis = await analyzeRevisionFabricability(revisionId)
    return {
        fabricable: analysis.is_fully_fabricable,
        reason: analysis.blocking_reason
    }
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
