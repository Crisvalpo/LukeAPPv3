/**
 * Pipe Inventory & Dispatch Service
 * Manages pipe sticks, bulk allocation, and cutting orders
 */

import { createClient } from '@/lib/supabase/client'

export interface PipeStick {
    id: string
    project_id: string
    ident_code: string
    material_spec?: string
    initial_length: number
    current_length: number
    heat_number?: string
    location: 'WAREHOUSE' | 'IN_TRANSIT' | 'WORKSHOP' | 'SCRAP' | 'INSTALLED'
    warehouse_id?: string
    delivery_id?: string
    created_at: string
}

export interface PipeNeed {
    ident_code: string
    material_spec: string
    total_required_meters: number
    spool_ids: string[]
}

export type PipeAllocationResult = {
    allocated_sticks: { stick_id: string; cut_length: number; spool_id: string }[]
    shortage_meters: number
}

/**
 * Calculate total pipe needs from a list of Spools
 */
export async function aggregatePipeNeeds(
    projectId: string,
    spoolIds: string[]
): Promise<PipeNeed[]> {
    const supabase = createClient()

    // Get material items for these spools that are Pipes
    // Joining with material_catalog to filter by 'MET Pipes and Tubes' would be ideal
    // For now we check part_group or assume item_code/description logic
    const { data: items, error } = await supabase
        .from('spools_mto')
        .select(`
            item_code,
            qty,
            spool_id,
            material_catalog!left(part_group, short_desc)
        `)
        .in('spool_id', spoolIds)

    if (error) throw new Error(`Error fetching spool materials: ${error.message}`)

    const needsMap = new Map<string, PipeNeed>()

    // BETTER CHECK: Usually pipe qty is length. MTO table has qty. 
    items?.forEach(item => {
        // Safe access to material_catalog properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const catalog = item.material_catalog as any
        const partGroup = catalog?.part_group
        const shortDesc = catalog?.short_desc

        // Filter for Pipes (Logic: part_group='MET Pipes and Tubes' OR item_code starts with 'P')
        const isPipe = partGroup === 'MET Pipes and Tubes' ||
            item.item_code.startsWith('P') || // Fallback heuristic
            (item.qty > 1 && item.qty < 50) // Heuristic: Pipe qty is usually length in meters 

        // BETTER CHECK: Usually pipe qty is length. MTO table has qty. 
        // We should explicitly rely on catalog part_group when available.
        if (isPipe) {
            const key = item.item_code
            const current = needsMap.get(key) || {
                ident_code: item.item_code,
                material_spec: shortDesc || item.item_code,
                total_required_meters: 0,
                spool_ids: [] as string[]
            }

            current.total_required_meters += Number(item.qty)
            if (item.spool_id && !current.spool_ids.includes(item.spool_id)) {
                current.spool_ids.push(item.spool_id)
            }
            needsMap.set(key, current)
        }
    })

    return Array.from(needsMap.values())
}

/**
 * Allocate sticks for a specific need (Best Fit Algorithm)
 */
export async function allocateHealthiestSticks(
    projectId: string,
    identCode: string,
    requiredMeters: number
): Promise<{ sticksToUse: PipeStick[], totalAllocated: number }> {
    const supabase = createClient()

    // Get available sticks in Warehouse
    const { data: sticks } = await supabase
        .from('pipe_sticks')
        .select('*')
        .eq('project_id', projectId)
        .eq('ident_code', identCode)
        .eq('location', 'WAREHOUSE')
        .order('current_length', { ascending: true }) // Smallest first (Best Fit)? Or Largest first?
    // Best fit for cutting usually means minimizing scrap. 
    // For bulk dispatch, we just need enough total length.

    if (!sticks?.length) return { sticksToUse: [], totalAllocated: 0 }

    let accumulated = 0
    const selected: PipeStick[] = []

    for (const stick of sticks) {
        if (accumulated >= requiredMeters) break
        selected.push(stick as PipeStick)
        accumulated += stick.current_length
    }

    return { sticksToUse: selected, totalAllocated: accumulated }
}

/**
 * Create a Bulk Dispatch (Workshop Delivery)
 */
export async function createWorkshopDelivery(
    projectId: string,
    workshopId: string,
    stickIds: string[],
    notes?: string
): Promise<string> {
    const supabase = createClient()

    // 1. Create Delivery Header
    const { data: delivery, error: delError } = await supabase
        .from('workshop_deliveries')
        .insert({
            project_id: projectId,
            workshop_id: workshopId,
            delivery_number: `DEL-${Date.now().toString().slice(-6)}`, // Temp number gen
            status: 'PLANNED',
            notes
        })
        .select()
        .single()

    if (delError) throw new Error(`Error creating delivery: ${delError.message}`)

    // 2. Assign Sticks to Delivery & Update Status
    const { error: stickError } = await supabase
        .from('pipe_sticks')
        .update({
            delivery_id: delivery.id,
            location: 'IN_TRANSIT'
        })
        .in('id', stickIds)

    if (stickError) throw new Error(`Error assigning sticks: ${stickError.message}`)

    return delivery.id
}

/**
 * Receive Delivery at Workshop
 */
export async function receiveDelivery(deliveryId: string): Promise<void> {
    const supabase = createClient()

    // 1. Get Delivery
    const { data: delivery } = await supabase
        .from('workshop_deliveries')
        .select('workshop_id')
        .eq('id', deliveryId)
        .single()

    if (!delivery) throw new Error('Delivery not found')

    // 2. Update Delivery Status
    await supabase
        .from('workshop_deliveries')
        .update({ status: 'RECEIVED', received_date: new Date().toISOString() })
        .eq('id', deliveryId)

    // 3. Update Sticks Location
    await supabase
        .from('pipe_sticks')
        .update({
            location: 'WORKSHOP',
            current_workshop_id: delivery.workshop_id
        })
        .eq('delivery_id', deliveryId)
}

/**
 * Generate Cutting Orders for a list of Spools
 * This would be called when spools are released for fabrication
 */
/**
 * Get Inventory at a specific Workshop
 */
export async function getWorkshopInventory(projectId: string, workshopId?: string): Promise<PipeStick[]> {
    const supabase = createClient()
    let query = supabase
        .from('pipe_sticks')
        .select('*')
        .eq('project_id', projectId)
        .eq('location', 'WORKSHOP')

    if (workshopId) {
        query = query.eq('current_workshop_id', workshopId)
    }

    const { data } = await query
    return (data as PipeStick[]) || []
}

/**
 * Process a physical cut on a stick
 * Updates the stick's remaining length and logs the cut order
 */
export async function processPipeCut(
    projectId: string,
    stickId: string,
    cutLength: number,
    spoolId: string,
    userId: string
): Promise<void> {
    const supabase = createClient()

    // 1. Get current stick state
    const { data: stick, error: fetchError } = await supabase
        .from('pipe_sticks')
        .select('current_length')
        .eq('id', stickId)
        .single()

    if (fetchError || !stick) throw new Error('Stick not found')

    if (stick.current_length < cutLength) {
        throw new Error(`Insufficient length. Stick has ${stick.current_length}m, required ${cutLength}m`)
    }

    const newLength = stick.current_length - cutLength
    const isFullyConsumed = newLength < 0.1 // Treat <10cm as scrap/consumed

    // 2. Register Query (Transaction-like)
    // Update Stick
    const { error: updateError } = await supabase
        .from('pipe_sticks')
        .update({
            current_length: newLength,
            location: isFullyConsumed ? 'SCRAP' : 'WORKSHOP'
        })
        .eq('id', stickId)

    if (updateError) throw new Error(`Error updating stick: ${updateError.message}`)

    // 3. Log Cutting Order (As completed execution)
    await supabase.from('pipe_cutting_orders').insert({
        project_id: projectId,
        spool_id: spoolId,
        stick_id: stickId,
        required_length: cutLength,
        status: 'CUT',
        cut_date: new Date().toISOString(),
        cut_by: userId
    })
}
