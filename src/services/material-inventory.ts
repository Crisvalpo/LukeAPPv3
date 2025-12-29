/**
 * Material Inventory Service
 * Manages bulk material inventory
 */

import { createClient } from '@/lib/supabase/client'
import type { MaterialInventory } from '@/types'

/**
 * Get inventory for a project
 */
export async function getMaterialInventory(projectId: string): Promise<MaterialInventory[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('project_id', projectId)
        .order('material_spec')

    if (error) throw new Error(`Error fetching inventory: ${error.message}`)
    return data || []
}

/**
 * Get inventory by location
 */
export async function getInventoryByLocation(
    projectId: string,
    location: string
): Promise<MaterialInventory[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('project_id', projectId)
        .eq('location', location)
        .order('material_spec')

    if (error) throw new Error(`Error fetching inventory: ${error.message}`)
    return data || []
}

/**
 * Check material availability
 */
export async function checkMaterialAvailability(
    projectId: string,
    materialSpec: string,
    quantityNeeded: number,
    location?: string
): Promise<{
    available: boolean
    quantityAvailable: number
    deficit: number
}> {
    const supabase = createClient()

    let query = supabase
        .from('material_inventory')
        .select('quantity_available, quantity_allocated')
        .eq('project_id', projectId)
        .eq('material_spec', materialSpec)

    if (location) {
        query = query.eq('location', location)
    }

    const { data, error } = await supabase
        .from('material_inventory')
        .select('quantity_available, quantity_allocated')
        .eq('project_id', projectId)
        .eq('material_spec', materialSpec)

    if (error) {
        throw new Error(`Error checking availability: ${error.message}`)
    }

    const totalAvailable = data.reduce(
        (sum, item) => sum + (item.quantity_available - item.quantity_allocated),
        0
    )

    return {
        available: totalAvailable >= quantityNeeded,
        quantityAvailable: totalAvailable,
        deficit: Math.max(0, quantityNeeded - totalAvailable)
    }
}

/**
 * Allocate material (reserve for a specific use)
 */
export async function allocateMaterial(
    projectId: string,
    materialSpec: string,
    quantity: number,
    location: string = 'BODEGA'
): Promise<void> {
    const supabase = createClient()

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('project_id', projectId)
        .eq('material_spec', materialSpec)
        .eq('location', location)
        .single()

    if (fetchError) {
        throw new Error(`Material not found in inventory: ${fetchError.message}`)
    }

    const availableQuantity = inventory.quantity_available - inventory.quantity_allocated

    if (availableQuantity < quantity) {
        throw new Error(
            `Insufficient material. Available: ${availableQuantity}, Requested: ${quantity}`
        )
    }

    // Update allocated quantity
    const { error: updateError } = await supabase
        .from('material_inventory')
        .update({
            quantity_allocated: inventory.quantity_allocated + quantity
        })
        .eq('id', inventory.id)

    if (updateError) {
        throw new Error(`Error allocating material: ${updateError.message}`)
    }
}

/**
 * Release allocated material (undo allocation)
 */
export async function releaseMaterial(
    projectId: string,
    materialSpec: string,
    quantity: number,
    location: string = 'BODEGA'
): Promise<void> {
    const supabase = createClient()

    const { data: inventory, error: fetchError } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('project_id', projectId)
        .eq('material_spec', materialSpec)
        .eq('location', location)
        .single()

    if (fetchError) {
        throw new Error(`Material not found: ${fetchError.message}`)
    }

    const { error: updateError } = await supabase
        .from('material_inventory')
        .update({
            quantity_allocated: Math.max(0, inventory.quantity_allocated - quantity)
        })
        .eq('id', inventory.id)

    if (updateError) {
        throw new Error(`Error releasing material: ${updateError.message}`)
    }
}

/**
 * Consume material (actually use it, reduce available quantity)
 */
export async function consumeMaterial(
    projectId: string,
    materialSpec: string,
    quantity: number,
    location: string = 'BODEGA'
): Promise<void> {
    const supabase = createClient()

    const { data: inventory, error: fetchError } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('project_id', projectId)
        .eq('material_spec', materialSpec)
        .eq('location', location)
        .single()

    if (fetchError) {
        throw new Error(`Material not found: ${fetchError.message}`)
    }

    if (inventory.quantity_available < quantity) {
        throw new Error(
            `Insufficient material. Available: ${inventory.quantity_available}, Requested: ${quantity}`
        )
    }

    const { error: updateError } = await supabase
        .from('material_inventory')
        .update({
            quantity_available: inventory.quantity_available - quantity,
            quantity_allocated: Math.max(0, inventory.quantity_allocated - quantity)
        })
        .eq('id', inventory.id)

    if (updateError) {
        throw new Error(`Error consuming material: ${updateError.message}`)
    }
}

/**
 * Get inventory summary by material spec
 */
export async function getInventorySummary(projectId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_inventory')
        .select('material_spec, quantity_available, quantity_allocated, location')
        .eq('project_id', projectId)

    if (error) {
        throw new Error(`Error fetching inventory summary: ${error.message}`)
    }

    // Group by material_spec
    const summary = data.reduce((acc, item) => {
        if (!acc[item.material_spec]) {
            acc[item.material_spec] = {
                material_spec: item.material_spec,
                total_available: 0,
                total_allocated: 0,
                locations: []
            }
        }

        acc[item.material_spec].total_available += item.quantity_available
        acc[item.material_spec].total_allocated += item.quantity_allocated
        acc[item.material_spec].locations.push({
            location: item.location,
            available: item.quantity_available,
            allocated: item.quantity_allocated
        })

        return acc
    }, {} as Record<string, any>)

    return Object.values(summary)
}
