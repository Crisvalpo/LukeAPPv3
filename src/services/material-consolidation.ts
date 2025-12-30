/**
 * Material Consolidation Service
 * Aggregates MTO data for Procurement use (Consolidado MTO)
 */

import { createClient } from '@/lib/supabase/client'

export interface MTOByIsometric {
    isometric_id: string
    iso_number: string
    spools: {
        spool_id: string
        spool_name: string
        items: MTOItemSummary[]
    }[]
}

export interface MTOItemSummary {
    id: string
    material_spec: string
    description: string
    quantity_required: number
    quantity_requested: number // From material_request_items
    quantity_received: number
    unit: string
    spool_id: string
    isometric_id: string
}

/**
 * Get MTO consolidation grouped by Isometric -> Spool
 */
export async function getConsolidatedMTO(projectId: string): Promise<MTOByIsometric[]> {
    const supabase = createClient()

    // 1. Step A: Get Isometrics with their Current Revision ID
    const { data: isometrics, error: isoError } = await supabase
        .from('isometrics')
        .select('id, iso_number, current_revision_id')
        .eq('project_id', projectId)
        .not('current_revision_id', 'is', null) // Only Isos with active revisions
        .order('iso_number')

    if (isoError) throw new Error(`Error fetching isometrics: ${isoError.message}`)
    if (!isometrics?.length) return []

    // Map Revision ID -> Isometric
    const revisionToIsoMap = new Map<string, typeof isometrics[0]>()
    // Map Isometric ID -> MTOGroup
    const isoGroupMap = new Map<string, MTOByIsometric>()

    // Collect active revision IDs
    const activeRevisionIds = isometrics.map(iso => {
        // Safe assertion because we filtered nulls
        const revId = iso.current_revision_id!
        revisionToIsoMap.set(revId, iso)

        // Initialize the group
        isoGroupMap.set(iso.id, {
            isometric_id: iso.id,
            iso_number: iso.iso_number,
            spools: []
        })

        return revId
    })

    // Step B: Query spools_mto filtered by these Active Revision IDs
    const { data: mtoItems, error: mtoError } = await supabase
        .from('spools_mto')
        .select(`
            id,
            spool_id,
            revision_id,
            item_code,
            qty,
            qty_unit,
            spool_full_id,
            spool_number,
            rev_number
        `)
        .in('revision_id', activeRevisionIds)

    if (mtoError) throw new Error(`Error fetching MTO: ${mtoError.message}`)

    // Step C: Fetch material catalog for enriched descriptions (if exists)
    const { data: catalogItems } = await supabase
        .from('material_catalog')
        .select('ident_code, short_desc, long_desc, part_group')
        .eq('project_id', projectId)

    // Create lookup map for quick access
    const catalogMap = new Map<string, { ident_code: string, short_desc: string, long_desc: string | null, part_group: string | null }>()
    catalogItems?.forEach(item => {
        catalogMap.set(item.ident_code, item)
    })

    // Step C: Get existing Material Requests to calculate "Requested" qty (Optional for now)
    // const { data: requestItems } = ... 

    // Process MTO items
    mtoItems?.forEach(item => {
        // Find which Isometric this revision belongs to
        const iso = revisionToIsoMap.get(item.revision_id)
        if (!iso) return

        const isoGroup = isoGroupMap.get(iso.id)
        if (!isoGroup) return

        // Deduce Spool Name and create unique grouping key
        // Use spool_number (e.g., "SP01") as the primary grouping key since spool_id is often null
        const spoolGroupKey = item.spool_number || `unknown-${item.id}`

        // Find or create spool group within this Iso
        let spoolGroup = isoGroup.spools.find(s => s.spool_id === spoolGroupKey)

        // If we don't have a spool group yet
        if (!spoolGroup) {
            // Extract readable spool name
            let spoolName = item.spool_number || 'Spool General'

            // Add revision info to spool name if available
            if (item.rev_number) {
                spoolName += ` (Rev ${item.rev_number})`
            }

            spoolGroup = {
                spool_id: spoolGroupKey, // Using spool_number as ID for uniqueness
                spool_name: spoolName,
                items: []
            }
            isoGroup.spools.push(spoolGroup)
        }

        // Get enriched description from catalog if available
        const catalogEntry = catalogMap.get(item.item_code)
        const materialDesc = catalogEntry?.short_desc || item.item_code

        spoolGroup.items.push({
            id: item.id,
            material_spec: materialDesc,
            description: catalogEntry?.long_desc || materialDesc,
            quantity_required: Number(item.qty),
            quantity_requested: 0, // TODO: Implement request tracking
            quantity_received: 0,
            unit: item.qty_unit || 'PCS',
            spool_id: spoolGroupKey,
            isometric_id: iso.id
        })
    })

    // Sort spools by name
    isoGroupMap.forEach(group => {
        group.spools.sort((a, b) => a.spool_name.localeCompare(b.spool_name))
    })

    return Array.from(isoGroupMap.values()).filter(g => g.spools.length > 0)
}
