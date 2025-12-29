/**
 * Material Requests Service
 * Manages Material Issue Requests (MIR) and Purchase Orders
 */

import { createClient } from '@/lib/supabase/client'
import type {
    MaterialRequest,
    MaterialRequestItem,
    MaterialReceipt,
    MaterialReceiptItem,
    CreateMaterialRequestParams,
    CreateMaterialReceiptParams,
    MaterialRequestStatusEnum
} from '@/types'

/**
 * Get all material requests for a project
 */
export async function getMaterialRequests(projectId: string): Promise<MaterialRequest[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching material requests: ${error.message}`)
    return data || []
}

/**
 * Get a single material request with its items
 */
export async function getMaterialRequestDetails(requestId: string) {
    const supabase = createClient()

    const [requestResult, itemsResult] = await Promise.all([
        supabase
            .from('material_requests')
            .select('*')
            .eq('id', requestId)
            .single(),
        supabase
            .from('material_request_items')
            .select('*')
            .eq('request_id', requestId)
    ])

    if (requestResult.error) {
        throw new Error(`Error fetching request: ${requestResult.error.message}`)
    }

    if (itemsResult.error) {
        throw new Error(`Error fetching items: ${itemsResult.error.message}`)
    }

    return {
        request: requestResult.data as MaterialRequest,
        items: itemsResult.data as MaterialRequestItem[]
    }
}

/**
 * Create a new material request (MIR or PO)
 */
export async function createMaterialRequest(
    params: CreateMaterialRequestParams,
    companyId: string
): Promise<MaterialRequest> {
    const supabase = createClient()

    // Create the request header
    const { data: request, error: requestError } = await supabase
        .from('material_requests')
        .insert({
            project_id: params.project_id,
            company_id: companyId,
            request_type: params.request_type,
            notes: params.notes,
            status: 'DRAFT',
            request_number: '' // Trigger will generate this
        })
        .select()
        .single()

    if (requestError) {
        throw new Error(`Error creating material request: ${requestError.message}`)
    }

    // Create the items
    const itemsToInsert = params.items.map(item => ({
        request_id: request.id,
        material_spec: item.material_spec,
        quantity_requested: item.quantity_requested,
        spool_id: item.spool_id,
        isometric_id: item.isometric_id
    }))

    const { error: itemsError } = await supabase
        .from('material_request_items')
        .insert(itemsToInsert)

    if (itemsError) {
        // Rollback: delete the request if items fail
        await supabase.from('material_requests').delete().eq('id', request.id)
        throw new Error(`Error creating request items: ${itemsError.message}`)
    }

    return request as MaterialRequest
}

/**
 * Update material request status
 */
export async function updateMaterialRequestStatus(
    requestId: string,
    status: MaterialRequestStatusEnum,
    etaDate?: string
): Promise<void> {
    const supabase = createClient()

    const updateData: any = { status }
    if (etaDate) {
        updateData.eta_date = etaDate
    }

    const { error } = await supabase
        .from('material_requests')
        .update(updateData)
        .eq('id', requestId)

    if (error) {
        throw new Error(`Error updating request status: ${error.message}`)
    }
}

/**
 * Update approved quantities for request items
 */
export async function updateApprovedQuantities(
    items: { id: string; quantity_approved: number }[]
): Promise<void> {
    const supabase = createClient()

    const updates = items.map(item =>
        supabase
            .from('material_request_items')
            .update({ quantity_approved: item.quantity_approved })
            .eq('id', item.id)
    )

    const results = await Promise.all(updates)

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
        throw new Error(`Error updating approved quantities: ${errors[0].error?.message}`)
    }
}

/**
 * Create a material receipt (receiving event)
 */
export async function createMaterialReceipt(
    params: CreateMaterialReceiptParams,
    userId: string
): Promise<MaterialReceipt> {
    const supabase = createClient()

    // Get request details to get project_id
    const { data: request, error: requestError } = await supabase
        .from('material_requests')
        .select('project_id')
        .eq('id', params.request_id)
        .single()

    if (requestError) {
        throw new Error(`Error fetching request: ${requestError.message}`)
    }

    // Create receipt header
    const { data: receipt, error: receiptError } = await supabase
        .from('material_receipts')
        .insert({
            request_id: params.request_id,
            project_id: request.project_id,
            delivery_note: params.delivery_note,
            received_by: userId
        })
        .select()
        .single()

    if (receiptError) {
        throw new Error(`Error creating receipt: ${receiptError.message}`)
    }

    // Create receipt items
    const itemsToInsert = params.items.map(item => ({
        receipt_id: receipt.id,
        request_item_id: item.request_item_id,
        quantity: item.quantity,
        batch_id: item.batch_id
    }))

    const { error: itemsError } = await supabase
        .from('material_receipt_items')
        .insert(itemsToInsert)

    if (itemsError) {
        // Rollback
        await supabase.from('material_receipts').delete().eq('id', receipt.id)
        throw new Error(`Error creating receipt items: ${itemsError.message}`)
    }

    // Triggers will handle:
    // - Updating inventory
    // - Updating quantity_received in request_items
    // - Updating request status

    return receipt as MaterialReceipt
}

/**
 * Get receipts for a material request
 */
export async function getMaterialReceipts(requestId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_receipts')
        .select(`
            *,
            material_receipt_items (*)
        `)
        .eq('request_id', requestId)
        .order('receipt_date', { ascending: false })

    if (error) {
        throw new Error(`Error fetching receipts: ${error.message}`)
    }

    return data
}

/**
 * Delete a material request (only if DRAFT)
 */
export async function deleteMaterialRequest(requestId: string): Promise<void> {
    const supabase = createClient()

    // Check status first
    const { data: request, error: fetchError } = await supabase
        .from('material_requests')
        .select('status')
        .eq('id', requestId)
        .single()

    if (fetchError) {
        throw new Error(`Error fetching request: ${fetchError.message}`)
    }

    if (request.status !== 'DRAFT') {
        throw new Error('Only DRAFT requests can be deleted')
    }

    const { error } = await supabase
        .from('material_requests')
        .delete()
        .eq('id', requestId)

    if (error) {
        throw new Error(`Error deleting request: ${error.message}`)
    }
}
