/**
 * Material Tracking Service
 * Fetches and groups material request items by isometric → spool → requests
 * for comprehensive material tracking and history
 */

import { createClient } from '@/lib/supabase/client'

export interface MaterialTrackingItem {
    id: string
    request_id: string
    material_spec: string
    quantity_requested: number
    quantity_received: number
    spool_id: string | null
    isometric_id: string | null
    // Catalog info
    item_code?: string
    description?: string
    inputs?: any
    // Spool info
    spool_number?: string
    spool_tag?: string
    revision_number?: string
    // Iso info
    iso_number?: string
    // Request info
    request_number?: string
    request_type?: string
    request_status?: string
    request_date?: string
    // Calculated
    request_ids: string[]  // All requests this material belongs to
}

export interface SpoolGroup {
    spool_id: string
    spool_number: string
    spool_tag: string
    revision_number: string
    items: MaterialTrackingItem[]
    requests: RequestSummary[]
}

export interface IsometricGroup {
    iso_id: string
    iso_number: string
    spools: SpoolGroup[]
    total_items: number
    total_requests: number
}

export interface RequestSummary {
    id: string
    request_number: string
    request_type: 'CLIENT_MIR' | 'CONTRACTOR_PO'
    status: string
    created_at: string
    item_count: number
    affected_spools: number
}

export interface MaterialTrackingData {
    isometrics: IsometricGroup[]
    allRequests: RequestSummary[]
}

/**
 * Fetch all material request items with full context
 */
export async function fetchMaterialTracking(
    projectId: string,
    options: { search?: string, limit?: number, offset?: number } = {}
): Promise<MaterialTrackingData> {
    const supabase = createClient()
    const { search, limit = 20, offset = 0 } = options

    let query = supabase
        .from('material_request_items')
        .select(`
            id,
            request_id,
            material_spec,
            quantity_requested,
            quantity_received,
            spool_id,
            isometric_id,
            isometric:isometrics!isometric_id(
                id,
                iso_number
            ),
            catalog:material_catalog!catalog_id(
                id,
                ident_code,
                short_desc,
                long_desc
            ),
            spool:spools!spool_id(
                id,
                spool_number,
                management_tag,
                revision:engineering_revisions!inner!revision_id(
                    id,
                    rev_code,
                    isometric:isometrics!inner!isometric_id(
                        id,
                        iso_number
                    )
                )
            ),
            request:material_requests!inner!request_id(
                id,
                request_number,
                request_type,
                status,
                created_at,
                project_id
            )
        `)
        .eq('request.project_id', projectId)
        .order('created_at', { foreignTable: 'material_requests', ascending: false })
        .order('id', { ascending: false }) // Fallback sort
        .range(offset, offset + limit - 1)

    if (search) {
        // Filter by ISO number or Spool Number using the inner joined tables
        // Note: Supabase OR with nested relations is tricky. 
        // For now let's prioritize ISO search as requested.
        query = query.ilike('spool.revision.isometric.iso_number', `%${search}%`)
    }

    const { data: items, error } = await query

    if (error) {
        throw new Error(`Error fetching material tracking: ${error.message}`)
    }

    if (!items || items.length === 0) {
        return { isometrics: [], allRequests: [] }
    }

    // Group data
    return groupMaterialTrackingData(items)
}

/**
 * Group raw items into hierarchical structure
 */
function groupMaterialTrackingData(rawItems: any[]): MaterialTrackingData {
    // Transform raw items
    const transformedItems: MaterialTrackingItem[] = rawItems.map(item => ({
        id: item.id,
        request_id: item.request_id,
        material_spec: item.material_spec,
        quantity_requested: item.quantity_requested,
        quantity_received: item.quantity_received || 0,
        spool_id: item.spool_id,
        isometric_id: item.isometric_id,
        item_code: item.catalog?.ident_code || item.material_spec,
        description: item.catalog?.short_desc || item.material_spec,
        inputs: null,
        spool_number: item.spool?.spool_number || 'Sin Spool',
        spool_tag: item.spool?.management_tag || '',
        revision_number: item.spool?.revision?.rev_code || '?',
        iso_number: item.spool?.revision?.isometric?.iso_number || item.isometric?.iso_number || 'Sin Isométrico',
        request_number: item.request?.request_number || '',
        request_type: item.request?.request_type as 'CLIENT_MIR' | 'CONTRACTOR_PO',
        request_status: item.request?.status,
        request_date: item.request?.created_at,
        request_ids: [item.request_id]  // Will be merged later
    }))

    // 1. Group by iso → spool → items
    const isoMap = new Map<string, Map<string, MaterialTrackingItem[]>>()

    transformedItems.forEach(item => {
        const isoKey = item.iso_number || 'Sin Isométrico'
        const spoolKey = item.spool_id || 'no-spool'

        if (!isoMap.has(isoKey)) {
            isoMap.set(isoKey, new Map())
        }

        const spoolMap = isoMap.get(isoKey)!
        if (!spoolMap.has(spoolKey)) {
            spoolMap.set(spoolKey, [])
        }

        spoolMap.get(spoolKey)!.push(item)
    })

    // 2. Build isometric groups
    const isometrics: IsometricGroup[] = []

    isoMap.forEach((spoolMap, isoNumber) => {
        const spools: SpoolGroup[] = []

        spoolMap.forEach((items, spoolKey) => {
            // Get unique requests for this spool
            const requestIds = new Set<string>()
            items.forEach(item => requestIds.add(item.request_id))

            const requests: RequestSummary[] = Array.from(requestIds).map(reqId => {
                const firstItem = items.find(i => i.request_id === reqId)!
                return {
                    id: reqId,
                    request_number: firstItem.request_number || '',
                    request_type: (firstItem.request_type || 'CLIENT_MIR') as 'CLIENT_MIR' | 'CONTRACTOR_PO',
                    status: firstItem.request_status || 'DRAFT',
                    created_at: firstItem.request_date || '',
                    item_count: items.filter(i => i.request_id === reqId).length,
                    affected_spools: 1  // Will be calculated later
                }
            }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            spools.push({
                spool_id: spoolKey,
                spool_number: items[0].spool_number || 'Sin Spool',
                spool_tag: items[0].spool_tag || '',
                revision_number: items[0].revision_number || '?',
                items,
                requests
            })
        })

        const totalRequests = new Set(
            spools.flatMap(s => s.requests.map(r => r.id))
        ).size

        isometrics.push({
            iso_id: spools[0]?.items[0]?.isometric_id || 'no-iso',
            iso_number: isoNumber,
            spools,
            total_items: spools.reduce((sum, s) => sum + s.items.length, 0),
            total_requests: totalRequests
        })
    })

    // 3. Build all requests summary (for sidebar)
    const requestMap = new Map<string, RequestSummary>()

    transformedItems.forEach(item => {
        if (!requestMap.has(item.request_id)) {
            requestMap.set(item.request_id, {
                id: item.request_id,
                request_number: item.request_number || '',
                request_type: (item.request_type || 'CLIENT_MIR') as 'CLIENT_MIR' | 'CONTRACTOR_PO',
                status: item.request_status || 'DRAFT',
                created_at: item.request_date || '',
                item_count: 0,
                affected_spools: 0
            })
        }

        const req = requestMap.get(item.request_id)!
        req.item_count++
    })

    // Calculate affected spools per request
    requestMap.forEach(req => {
        const spoolsInRequest = new Set<string>()
        transformedItems
            .filter(item => item.request_id === req.id)
            .forEach(item => {
                if (item.spool_id) spoolsInRequest.add(item.spool_id)
            })
        req.affected_spools = spoolsInRequest.size
    })

    const allRequests = Array.from(requestMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
        isometrics,
        allRequests
    }
}
