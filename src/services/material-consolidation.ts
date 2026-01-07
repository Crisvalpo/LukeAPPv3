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
        spool_tag?: string // Full ID for traceability
        items: MTOItemSummary[]
    }[]
}

export interface MTOByIsometricWithStats extends MTOByIsometric {
    stats: {
        total_spools: number
        total_items: number
        total_quantity: number
    }
}

export interface MTOItemSummary {
    id: string
    item_code: string  // Material code (e.g., "1.5-90-LR-150-XXS-A106B")
    material_spec: string
    description: string
    input1: string | null
    input2: string | null
    input3: string | null
    input4: string | null
    quantity_required: number
    quantity_requested: number // From material_request_items
    quantity_received: number
    unit: string
    spool_id: string | null // UUID from spools table, or null if not linked
    isometric_id: string
}

/**
 * Search MTO with pagination and filters
 * Returns isometrics with their spools and materials, optimized for large datasets
 */
export async function searchConsolidatedMTO(
    projectId: string,
    searchQuery: string = '',
    offset: number = 0,
    limit: number = 10
): Promise<MTOByIsometricWithStats[]> {
    const supabase = createClient()
    const trimmedQuery = searchQuery.trim()

    // 1. Find Matching Isometric IDs (Advanced Search)
    let matchingIsoIds: string[] | null = null

    if (trimmedQuery) {
        // A. Search by Iso Number directly
        const { data: isoMatches } = await supabase
            .from('isometrics')
            .select('id')
            .eq('project_id', projectId)
            .ilike('iso_number', `%${trimmedQuery}%`)

        const idsFromIsos = isoMatches?.map(i => i.id) || []

        // B. Search by Spool or Item Code in spools_mto
        // We get revision_id, then we need to map to isometric_id
        // (Note: This depends on spools_mto having current revision items, or we filter later)
        const { data: mtoMatches } = await supabase
            .from('spools_mto')
            .select('revision_id')
            .or(`spool_number.ilike.%${trimmedQuery}%,item_code.ilike.%${trimmedQuery}%`)
            .limit(100) // Limit deep search results for performance

        // We need to resolve revision_id -> isometric_id
        let idsFromMto: string[] = []
        if (mtoMatches && mtoMatches.length > 0) {
            const revIds = mtoMatches.map(m => m.revision_id)
            const { data: revIsoMap } = await supabase
                .from('isometrics')
                .select('id')
                .in('current_revision_id', revIds)

            if (revIsoMap) {
                idsFromMto = revIsoMap.map(i => i.id)
            }
        }

        // C. Search by Management Tag in spools
        const { data: spoolMatches } = await supabase
            .from('spools')
            .select('revision_id')
            .ilike('management_tag', `%${trimmedQuery}%`)
            .limit(100)

        let idsFromSpools: string[] = []
        if (spoolMatches && spoolMatches.length > 0) {
            const revIds = spoolMatches.map(s => s.revision_id)
            const { data: revIsoMap } = await supabase
                .from('isometrics')
                .select('id')
                .in('current_revision_id', revIds)

            if (revIsoMap) {
                idsFromSpools = revIsoMap.map(i => i.id)
            }
        }

        // D. Combine and Deduplicate
        // Use a Set to unique
        matchingIsoIds = Array.from(new Set([...idsFromIsos, ...idsFromMto, ...idsFromSpools]))

        // If no matches found after searching both, return empty immediately
        if (matchingIsoIds.length === 0) return []
    }

    // 2. Fetch Paginated Isometrics (filtered by IDs if search is active)
    let isoQuery = supabase
        .from('isometrics')
        .select('id, iso_number, current_revision_id')
        .eq('project_id', projectId)
        .not('current_revision_id', 'is', null)
        .order('iso_number')

    if (matchingIsoIds !== null) {
        isoQuery = isoQuery.in('id', matchingIsoIds)
    }

    const { data: isometrics, error: isoError } = await isoQuery
        .range(offset, offset + limit - 1)

    if (isoError) throw new Error(`Error fetching isometrics: ${isoError.message}`)
    if (!isometrics?.length) return []

    // Map setup
    const revisionToIsoMap = new Map<string, typeof isometrics[0]>()
    const isoGroupMap = new Map<string, MTOByIsometricWithStats>()
    const activeIsoIds = isometrics.map(i => i.id)

    const activeRevisionIds = isometrics.map(iso => {
        const revId = iso.current_revision_id!
        revisionToIsoMap.set(revId, iso)

        isoGroupMap.set(iso.id, {
            isometric_id: iso.id,
            iso_number: iso.iso_number,
            spools: [],
            stats: {
                total_spools: 0,
                total_items: 0,
                total_quantity: 0
            }
        })

        return revId
    })

    // 3. Query spools_mto
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

    // 3b. Fetch Spool Details (Management Tag) by Revision ID to be robust
    // 3b. Fetch Spool Details (Management Tag and UUID) by Revision ID to be robust
    const { data: spoolsData } = await supabase
        .from('spools')
        .select('id, spool_number, management_tag, revision_id')
        .in('revision_id', activeRevisionIds)

    // Map: "revisionId|spoolNumber" -> { tag, id }
    const spoolDetailMap = new Map<string, { tag: string, id: string }>()
    if (spoolsData) {
        spoolsData.forEach(s => {
            if (s.revision_id && s.spool_number) {
                const key = `${s.revision_id}|${s.spool_number}`
                spoolDetailMap.set(key, {
                    tag: s.management_tag || '',
                    id: s.id
                })
            }
        })
    }

    // 4. Fetch Requests & Receipts Data (NEW)
    let requestItems = null
    if (activeIsoIds.length > 0) {
        const { data: reqData, error: reqError } = await supabase
            .from('material_request_items')
            .select('id, request_id, material_spec, quantity_requested, quantity_received, spool_id, isometric_id')
            .in('isometric_id', activeIsoIds)

        if (reqError) {
            console.error('Error fetching requests:', JSON.stringify(reqError, null, 2))
        } else {
            requestItems = reqData
        }
    }

    // Index requests for fast lookup: Map<"spoolId|itemCode", {requested, received}>
    const procurementMap = new Map<string, { requested: number, received: number }>()

    if (requestItems) {
        requestItems.forEach(req => {
            // Note: req.spool_id here is from material_request_items which IS a UUID.
            // We match it against the resolved UUIDs later or aggregated keys.
            // If the map key was spool_number based, we'd need to convert.
            // But here we might just aggregate by spool_id if available.
            // However, spools_mto might not have consistent spool_ids.
            // For now, assume simple aggregation.
            if (req.spool_id && req.material_spec) {
                const key = `${req.spool_id}|${req.material_spec.toUpperCase()}`
                const current = procurementMap.get(key) || { requested: 0, received: 0 }

                current.requested += Number(req.quantity_requested) || 0
                current.received += Number(req.quantity_received) || 0

                procurementMap.set(key, current)
            }
        })
    }

    // 5. Fetch material catalog with custom fields
    const { data: catalogItems } = await supabase
        .from('material_catalog')
        .select('ident_code, short_desc, long_desc, part_group, custom_fields')
        .eq('project_id', projectId)

    const catalogMap = new Map<string, {
        ident_code: string
        short_desc: string
        long_desc: string | null
        part_group: string | null
        custom_fields: Record<string, any> | null
    }>()
    catalogItems?.forEach(item => {
        // Normalize code to uppercase to avoid case sensitivity issues
        const normalizedCode = item.ident_code?.toUpperCase() || item.ident_code
        if (!catalogMap.has(normalizedCode)) {
            catalogMap.set(normalizedCode, item)
        }
    })

    // 6. Process MTO items
    mtoItems?.forEach(item => {
        const iso = revisionToIsoMap.get(item.revision_id)
        if (!iso) return

        const isoGroup = isoGroupMap.get(iso.id)
        if (!isoGroup) return

        const spoolGroupKey = item.spool_number || `unknown-${item.id}`
        let spoolGroup = isoGroup.spools.find(s => s.spool_id === spoolGroupKey)

        // Resolve details
        const tagKey = `${item.revision_id}|${item.spool_number}`
        const spoolDetails = spoolDetailMap.get(tagKey)

        if (!spoolGroup) {
            let spoolName = item.spool_number || 'Spool General'
            if (item.rev_number) {
                spoolName += ` (Rev ${item.rev_number})`
            }

            spoolGroup = {
                spool_id: spoolGroupKey,
                spool_name: spoolName,
                // Use the fetched management tag, fallback to full ID only if tag is missing
                spool_tag: spoolDetails?.tag || item.spool_full_id,
                items: []
            }
            isoGroup.spools.push(spoolGroup)
            isoGroup.stats.total_spools++
        }

        // Normalize item code for lookup
        const normalizedItemCode = item.item_code?.toUpperCase() || item.item_code
        const catalogEntry = catalogMap.get(normalizedItemCode)
        const materialDesc = catalogEntry?.short_desc || item.item_code
        const qty = Number(item.qty)
        const customFields = catalogEntry?.custom_fields || {}

        // Procurement Data Lookup
        // We must use the REAL UUID for lookup if possible
        const resolvedSpoolId = spoolDetails?.id

        let procData = { requested: 0, received: 0 }
        if (resolvedSpoolId) {
            const procKey = `${resolvedSpoolId}|${normalizedItemCode}`
            procData = procurementMap.get(procKey) || { requested: 0, received: 0 }
        }

        spoolGroup.items.push({
            id: item.id,
            item_code: item.item_code,
            material_spec: materialDesc,
            description: catalogEntry?.long_desc || materialDesc,
            input1: customFields['Input 1'] || null,
            input2: customFields['Input 2'] || null,
            input3: customFields['Input 3'] || null,
            input4: customFields['Input 4'] || null,
            quantity_required: qty,
            quantity_requested: procData.requested,
            quantity_received: procData.received,
            unit: item.qty_unit || 'PCS',
            // Pass the REAL UUID from map. Fallback to null (never string).
            spool_id: resolvedSpoolId || null,
            isometric_id: iso.id
        })

        isoGroup.stats.total_items++
        isoGroup.stats.total_quantity += qty
    })

    // 7. Sort spools
    isoGroupMap.forEach(group => {
        group.spools.sort((a, b) => a.spool_name.localeCompare(b.spool_name))
    })

    return Array.from(isoGroupMap.values()).filter(g => g.spools.length > 0)
}

/**
 * Get MTO consolidation grouped by Isometric -> Spool
 * @deprecated Use searchConsolidatedMTO instead for better performance
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
        // Normalize code to uppercase to avoid case sensitivity issues
        const normalizedCode = item.ident_code?.toUpperCase() || item.ident_code
        // Only use the FIRST occurrence in case of duplicates
        if (!catalogMap.has(normalizedCode)) {
            catalogMap.set(normalizedCode, item)
        }
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
        // Normalize item code for lookup (matching the normalization used when populating the map)
        const normalizedItemCode = item.item_code?.toUpperCase() || item.item_code
        const catalogEntry = catalogMap.get(normalizedItemCode)
        const materialDesc = catalogEntry?.short_desc || item.item_code

        spoolGroup.items.push({
            id: item.id,
            item_code: item.item_code,
            material_spec: materialDesc,
            description: catalogEntry?.long_desc || materialDesc,
            input1: null,
            input2: null,
            input3: null,
            input4: null,
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
