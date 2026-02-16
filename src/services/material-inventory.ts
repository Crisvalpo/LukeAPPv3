import { createClient } from '@/lib/supabase/client'

export interface InventoryReception {
    id: string
    project_id: string
    company_id: string
    master_id: string
    dimension_id: string
    quantity_received: number
    quantity_available: number
    unit: string
    location_bin?: string
    heat_number?: string
    certificate_number?: string
    received_at: string
    notes?: string
}

export interface MaterialCommitment {
    id: string
    project_id: string
    spool_id: string
    inventory_id: string
    quantity_committed: number
}

/**
 * Register new material reception
 */
export async function receiveMaterials(data: Partial<InventoryReception>): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('inventory_receptions')
        .insert({
            ...data,
            quantity_available: data.quantity_received // Initially all is available
        })

    if (error) {
        console.error('Error receiving materials:', error)
        throw error
    }
}

/**
 * Run the automated allocation engine for a project
 */
export async function runAllocationEngine(projectId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.rpc('fn_run_allocation_engine', {
        p_project_id: projectId
    })

    if (error) {
        console.error('Error running allocation engine:', error)
        throw error
    }
}

/**
 * Get shortage report for a project
 * Returns materials that have more demand than stock
 */
export async function getShortageReport(projectId: string): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('fn_get_material_shortages', {
        p_project_id: projectId
    })

    if (error) {
        console.error('Error fetching shortage report:', error.message, error.details, error.hint)
        throw error
    }

    return data || []
}
