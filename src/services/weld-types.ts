/**
 * Service: Weld Type Configuration
 * Manages project-level configuration for weld/union types
 */

import { createClient } from '@/lib/supabase/server'

export interface WeldTypeConfig {
    id: string
    project_id: string
    company_id: string
    type_code: string
    type_name_es: string
    type_name_en?: string | null
    requires_welder: boolean
    icon: string
    color: string
    created_at: string
    updated_at: string
}

export interface ServiceResponse<T> {
    success: boolean
    message: string
    data?: T
}

export interface CreateWeldTypeParams {
    projectId: string
    companyId: string
    typeCode: string
    typeNameEs: string
    typeNameEn?: string
    requiresWelder: boolean
    icon?: string
    color?: string
}

export interface UpdateWeldTypeParams {
    projectId?: string
    companyId?: string
    typeCode?: string
    typeNameEs?: string
    typeNameEn?: string
    requiresWelder?: boolean
    icon?: string
    color?: string
}

/**
 * Get all weld types for a project
 * Types are auto-registered via trigger when Excel files are imported
 */
export async function getProjectWeldTypes(projectId: string): Promise<ServiceResponse<WeldTypeConfig[]>> {
    try {
        const supabase = await createClient()

        // Simply read from config table
        // Types are auto-registered by trigger when welds are imported
        const { data, error } = await supabase
            .from('project_weld_type_config')
            .select('*')
            .eq('project_id', projectId)
            .order('type_code')

        if (error) {
            return { success: false, message: error.message }
        }

        return {
            success: true,
            message: `Found ${data.length} weld types`,
            data: data || []
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error fetching weld types'
        }
    }
}

/**
 * Get specific weld type config
 */
export async function getWeldTypeConfig(
    projectId: string,
    typeCode: string
): Promise<{
    success: boolean
    data: WeldTypeConfig | null
    error?: string
}> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_weld_type_config')
        .select('*')
        .eq('project_id', projectId)
        .eq('type_code', typeCode)
        .maybeSingle()

    if (error) {
        console.error('[getWeldTypeConfig] Error:', error)
        return { success: false, data: null, error: error.message }
    }

    return { success: true, data }
}

/**
 * Create a new weld type
 */
export async function createWeldType(params: CreateWeldTypeParams): Promise<{
    success: boolean
    data: WeldTypeConfig | null
    error?: string
}> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_weld_type_config')
        .insert({
            project_id: params.projectId,
            company_id: params.companyId,
            type_code: params.typeCode.toUpperCase(),
            type_name_es: params.typeNameEs,
            type_name_en: params.typeNameEn,
            requires_welder: params.requiresWelder,
            icon: params.icon || '🔗',
            color: params.color || '#6b7280'
        })
        .select()
        .single()

    if (error) {
        console.error('[createWeldType] Error:', error)
        return { success: false, data: null, error: error.message }
    }

    return { success: true, data }
}

/**
 * Update weld type configuration
 * Simple UPDATE - all types are already in the table via auto-registration
 */
export async function updateWeldType(
    typeId: string,
    updates: UpdateWeldTypeParams
): Promise<ServiceResponse<WeldTypeConfig>> {
    try {
        const supabase = await createClient()

        // Build update payload
        const updateData: any = {}
        if (updates.typeNameEs !== undefined) updateData.type_name_es = updates.typeNameEs
        if (updates.typeNameEn !== undefined) updateData.type_name_en = updates.typeNameEn
        if (updates.requiresWelder !== undefined) updateData.requires_welder = updates.requiresWelder
        if (updates.icon !== undefined) updateData.icon = updates.icon
        if (updates.color !== undefined) updateData.color = updates.color

        // Execute update
        const { data, error } = await supabase
            .from('project_weld_type_config')
            .update(updateData)
            .eq('id', typeId)
            .select()
            .single()

        if (error) {
            return { success: false, message: error.message }
        }

        return {
            success: true,
            message: 'Weld type updated',
            data
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error updating weld type'
        }
    }
}

/**
 * Delete a weld type (use with caution)
 */
export async function deleteWeldType(typeId: string): Promise<{
    success: boolean
    error?: string
}> {
    const supabase = await createClient()

    // Check if type is in use
    const { data: usageData } = await supabase
        .from('spools_welds')
        .select('id')
        .eq('type_weld', typeId)
        .limit(1)

    if (usageData && usageData.length > 0) {
        return {
            success: false,
            error: 'No se puede eliminar: tipo en uso por uniones existentes'
        }
    }

    const { error } = await supabase
        .from('project_weld_type_config')
        .delete()
        .eq('id', typeId)

    if (error) {
        console.error('[deleteWeldType] Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Check if a weld type requires a welder
 * Helper for business logic
 */
export async function doesWeldTypeRequireWelder(
    projectId: string,
    typeCode: string
): Promise<boolean> {
    const result = await getWeldTypeConfig(projectId, typeCode)

    // Default to true (safe assumption) if config not found
    if (!result.success || !result.data) {
        return true
    }

    return result.data.requires_welder
}
