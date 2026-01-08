import { createClient } from '@/lib/supabase/client'

// Constants
const CACHE_KEY_REQUESTS = 'LUKAPP_OFFLINE_REQUESTS'
const CACHE_KEY_QUEUE = 'LUKAPP_OFFLINE_QUEUE'

// Types
export type ReceptionItem = {
    id: string
    request_id: string
    ident_code: string
    quantity_requested: number
    quantity_received: number
    description?: string
    uom?: string
    part_group?: string
}

export type PurchaseOrder = {
    id: string
    request_number: string
    project_id: string
    status: string
    created_at: string
}

export type ReceiveItemPayload = {
    request_id: string
    request_item_id: string
    project_id: string
    ident_code: string
    quantity: number
    heat_number: string
    location: string
    length?: number
    is_pipe: boolean
}

interface OfflineRequest {
    po: PurchaseOrder
    items: ReceptionItem[]
    updated_at: number
}

interface OfflineQueueItem {
    id: string
    payload: ReceiveItemPayload
    timestamp: number
    status: 'PENDING' | 'ERROR'
    error?: string
}

// 1. SYNC / DOWNLOAD DATA
export async function downloadProjectData(projectId: string) {
    const supabase = createClient()

    // Fetch all active requests for the project
    const { data: requests, error } = await supabase
        .from('material_requests')
        .select(`
            id, request_number, project_id, status, created_at,
            material_request_items (
                id, request_id, material_spec, quantity_requested, quantity_received, quantity_approved,
                material_catalog (short_desc, part_group)
            )
        `)
        .eq('project_id', projectId)
        .in('status', ['APPROVED', 'PARTIAL', 'SENT'])

    if (error) throw error
    if (!requests) return 0

    const cache: Record<string, OfflineRequest> = {}

    requests.forEach((r: any) => {
        const items = r.material_request_items.map((i: any) => ({
            id: i.id,
            request_id: r.id,
            ident_code: i.material_spec,
            quantity_requested: i.quantity_requested,
            quantity_received: i.quantity_received || 0,
            description: i.material_catalog?.short_desc || 'Sin descripción',
            uom: i.material_catalog?.part_group?.toUpperCase().includes('PIPE') ? 'M' : 'UN',
            part_group: i.material_catalog?.part_group
        }))

        cache[r.request_number] = {
            po: {
                id: r.id,
                request_number: r.request_number,
                project_id: r.project_id,
                status: r.status,
                created_at: r.created_at
            },
            items,
            updated_at: Date.now()
        }
    })

    localStorage.setItem(CACHE_KEY_REQUESTS, JSON.stringify(cache))
    return Object.keys(cache).length
}

// 2. FIND (Offline First)
export async function findPurchaseOrder(query: string, projectId: string) {
    // 1. Try Cache First
    try {
        const cacheRaw = localStorage.getItem(CACHE_KEY_REQUESTS)
        if (cacheRaw) {
            const cache = JSON.parse(cacheRaw) as Record<string, OfflineRequest>
            // Exact match or includes
            const key = Object.keys(cache).find(k => k.toUpperCase().includes(query.toUpperCase()))
            if (key) {
                console.log('Serving from Offline Cache:', key)
                return { success: true, data: cache[key] }
            }
        }
    } catch (e) {
        console.warn('Cache access error', e)
    }

    // 2. Fallback to Network
    const supabase = createClient()
    const { data: request, error } = await supabase
        .from('material_requests')
        .select(`
            id, request_number, project_id, status, created_at,
            material_request_items (
                id, request_id, material_spec, quantity_requested, quantity_received, quantity_approved,
                material_catalog (short_desc, part_group)
            )
        `)
        .ilike('request_number', `%${query}%`)
        .eq('project_id', projectId)
        .single()

    if (error) return { success: false, error: 'Orden no encontrada (ni local ni remota)' }

    const items = request.material_request_items.map((i: any) => ({
        id: i.id,
        request_id: request.id,
        ident_code: i.material_spec,
        quantity_requested: i.quantity_requested,
        quantity_received: i.quantity_received || 0,
        description: i.material_catalog?.short_desc || 'Sin descripción',
        uom: i.material_catalog?.part_group?.toUpperCase().includes('PIPE') ? 'M' : 'UN',
        part_group: i.material_catalog?.part_group
    }))

    return {
        success: true,
        data: {
            po: {
                id: request.id,
                request_number: request.request_number,
                project_id: request.project_id,
                status: request.status,
                created_at: request.created_at
            },
            items
        }
    }
}

// Helper to update local cache immediately
function updateLocalCache(requestId: string, itemId: string, quantity: number) {
    if (typeof localStorage === 'undefined') return

    try {
        const cacheRaw = localStorage.getItem(CACHE_KEY_REQUESTS)
        if (!cacheRaw) return

        const cache = JSON.parse(cacheRaw) as Record<string, OfflineRequest>

        // Find which key holds this request (we only have request number in key, need to search values)
        const requestKey = Object.keys(cache).find(key => cache[key].po.id === requestId)

        if (requestKey && cache[requestKey]) {
            const itemIndex = cache[requestKey].items.findIndex(i => i.id === itemId)
            if (itemIndex !== -1) {
                // Update quantity locally
                const current = cache[requestKey].items[itemIndex].quantity_received || 0
                cache[requestKey].items[itemIndex].quantity_received = current + quantity
                cache[requestKey].updated_at = Date.now()

                localStorage.setItem(CACHE_KEY_REQUESTS, JSON.stringify(cache))
                console.log('Local cache updated for item:', itemId, 'New Qty:', current + quantity)
            }
        }
    } catch (e) {
        console.error('Failed to update local cache:', e)
    }
}

// 3. RECEIVE (Optimistic / Queue)
export async function receiveItem(data: ReceiveItemPayload) {
    try {
        const result = await receiveItemNetwork(data)
        // If we get here, it was successful (network-wise)
        updateLocalCache(data.request_id, data.request_item_id, data.quantity)
        return result
    } catch (err: any) {
        console.log('Network failed, queuing offline action:', err)

        const queueItem: OfflineQueueItem = {
            id: crypto.randomUUID(),
            payload: data,
            timestamp: Date.now(),
            status: 'PENDING'
        }

        const queue = JSON.parse(localStorage.getItem(CACHE_KEY_QUEUE) || '[]')
        queue.push(queueItem)
        localStorage.setItem(CACHE_KEY_QUEUE, JSON.stringify(queue))

        // Optimistic Success with dummy QR
        // 'OFF-' prefix indicates it was generated offline
        const tempQr = `OFF-${crypto.randomUUID().split('-')[0].toUpperCase()}`

        // Update local cache optimistically too!
        updateLocalCache(data.request_id, data.request_item_id, data.quantity)

        return { success: true, qr_code: tempQr, offline: true }
    }
}

// Inner Network Call
async function receiveItemNetwork(data: ReceiveItemPayload) {
    const supabase = createClient()
    const {
        request_id, request_item_id, project_id,
        ident_code, quantity, heat_number, location,
        length, is_pipe
    } = data

    // 1. Check User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // 2. Create Receipt Header
    const { data: receipt, error: receiptError } = await supabase
        .from('material_receipts')
        .insert({
            request_id,
            project_id,
            received_by: user.id,
            notes: 'Recepción móvil'
        })
        .select()
        .single()

    if (receiptError) throw new Error(receiptError.message)

    // 3. Create Receipt Item
    const { error: itemError } = await supabase
        .from('material_receipt_items')
        .insert({
            receipt_id: receipt.id,
            request_item_id,
            quantity,
            batch_id: heat_number
        })

    if (itemError) throw new Error(itemError.message)

    // 4. Create Inventory Instance
    let instanceError = null
    const uniqueId = crypto.randomUUID().split('-')[0].toUpperCase()
    const qr_code = `M-${uniqueId}`

    const { data: project } = await supabase.from('projects').select('company_id').eq('id', project_id).single()
    if (!project) throw new Error('Proyecto inválido')

    if (is_pipe && length) {
        const { error } = await supabase
            .from('pipe_sticks')
            .insert({
                project_id,
                ident_code,
                initial_length: length,
                current_length: length,
                heat_number,
                location: location || 'BODEGA',
            })
        instanceError = error
    } else {
        const { error } = await supabase
            .from('material_instances')
            .insert({
                project_id,
                company_id: project.company_id,
                qr_code,
                material_spec: ident_code,
                source_batch_id: heat_number,
                status: 'ISSUED',
                request_item_id: request_item_id
            })
        instanceError = error
    }

    if (instanceError) throw new Error(instanceError.message)

    return { success: true, qr_code }
}

// 4. SYNC QUEUE
export async function syncOfflineQueue() {
    const queueRaw = localStorage.getItem(CACHE_KEY_QUEUE)
    if (!queueRaw) return 0

    const queue: OfflineQueueItem[] = JSON.parse(queueRaw)
    const pending = queue.filter(i => i.status === 'PENDING')

    if (pending.length === 0) return 0

    console.log(`Syncing ${pending.length} pending items...`)

    // copy queue to modify
    const newQueue = [...queue]
    let syncedCount = 0

    for (const item of pending) {
        try {
            await receiveItemNetwork(item.payload)
            // Remove success items
            const idx = newQueue.findIndex(q => q.id === item.id)
            if (idx !== -1) newQueue.splice(idx, 1)
            syncedCount++
        } catch (err: any) {
            console.error('Sync failed for item', item.id, err)
            // Mark as error
            const idx = newQueue.findIndex(q => q.id === item.id)
            if (idx !== -1) {
                newQueue[idx].status = 'ERROR'
                newQueue[idx].error = err.message
            }
        }
    }

    localStorage.setItem(CACHE_KEY_QUEUE, JSON.stringify(newQueue))
    return syncedCount
}

export function getOfflineQueueStatus() {
    if (typeof localStorage === 'undefined') return { pending: 0, errors: 0 }
    const queueRaw = localStorage.getItem(CACHE_KEY_QUEUE)
    if (!queueRaw) return { pending: 0, errors: 0 }
    const queue: OfflineQueueItem[] = JSON.parse(queueRaw)
    return {
        pending: queue.filter(i => i.status === 'PENDING').length,
        errors: queue.filter(i => i.status === 'ERROR').length
    }
}
