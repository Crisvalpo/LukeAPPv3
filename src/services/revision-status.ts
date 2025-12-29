/**
 * Revision Status Service
 * Helper functions for calculating and checking revision status
 */

import { createClient } from '@/lib/supabase/client'
import type {
    EngineeringRevision,
    DataStatusEnum,
    MaterialStatusEnum
} from '@/types'

/**
 * Calculate data status for a revision
 * Uses the database function calculate_data_status()
 */
export async function calculateDataStatus(revisionId: string): Promise<DataStatusEnum> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('calculate_data_status', {
        revision_id_param: revisionId
    })

    if (error) {
        throw new Error(`Error calculating data status: ${error.message}`)
    }

    return data as DataStatusEnum
}

/**
 * Calculate material status for a revision
 * Uses the database function calculate_material_status()
 */
export async function calculateMaterialStatus(revisionId: string): Promise<MaterialStatusEnum> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('calculate_material_status', {
        revision_id_param: revisionId
    })

    if (error) {
        throw new Error(`Error calculating material status: ${error.message}`)
    }

    return data as MaterialStatusEnum
}

/**
 * Check if a revision is fabricable
 * Uses the database function is_fabricable()
 */
export async function isFabricable(revisionId: string): Promise<boolean> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('is_fabricable', {
        revision_id_param: revisionId
    })

    if (error) {
        throw new Error(`Error checking fabricability: ${error.message}`)
    }

    return data as boolean
}

/**
 * Update revision status fields
 */
export async function updateRevisionStatus(
    revisionId: string,
    updates: {
        data_status?: DataStatusEnum
        material_status?: MaterialStatusEnum
    }
): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('engineering_revisions')
        .update(updates)
        .eq('id', revisionId)

    if (error) {
        throw new Error(`Error updating revision status: ${error.message}`)
    }
}

/**
 * Get fabricable revisions for a project
 */
export async function getFabricableRevisions(projectId: string): Promise<EngineeringRevision[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('engineering_revisions')
        .select(`
            *,
            isometrics (
                iso_number
            )
        `)
        .eq('project_id', projectId)
        .eq('revision_status', 'VIGENTE')
        .eq('data_status', 'COMPLETO')
        .eq('material_status', 'DISPONIBLE')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Error fetching fabricable revisions: ${error.message}`)
    }

    return data.map(rev => ({
        ...rev,
        iso_number: rev.isometrics?.iso_number || 'N/A'
    })) as EngineeringRevision[]
}

/**
 * Get revisions blocked by material
 */
export async function getRevisionsBlockedByMaterial(
    projectId: string
): Promise<EngineeringRevision[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('engineering_revisions')
        .select(`
            *,
            isometrics (
                iso_number
            )
        `)
        .eq('project_id', projectId)
        .eq('revision_status', 'VIGENTE')
        .eq('data_status', 'COMPLETO')
        .neq('material_status', 'DISPONIBLE')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Error fetching blocked revisions: ${error.message}`)
    }

    return data.map(rev => ({
        ...rev,
        iso_number: rev.isometrics?.iso_number || 'N/A'
    })) as EngineeringRevision[]
}

/**
 * Get revisions blocked by data
 */
export async function getRevisionsBlockedByData(
    projectId: string
): Promise<EngineeringRevision[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('engineering_revisions')
        .select(`
            *,
            isometrics (
                iso_number
            )
        `)
        .eq('project_id', projectId)
        .eq('revision_status', 'VIGENTE')
        .neq('data_status', 'COMPLETO')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Error fetching blocked revisions: ${error.message}`)
    }

    return data.map(rev => ({
        ...rev,
        iso_number: rev.isometrics?.iso_number || 'N/A'
    })) as EngineeringRevision[]
}

/**
 * Refresh all revision statuses (recalculate data_status and material_status)
 */
export async function refreshRevisionStatuses(projectId: string): Promise<void> {
    const supabase = createClient()

    // Get all revisions for the project
    const { data: revisions, error: fetchError } = await supabase
        .from('engineering_revisions')
        .select('id')
        .eq('project_id', projectId)

    if (fetchError) {
        throw new Error(`Error fetching revisions: ${fetchError.message}`)
    }

    // Update each revision's status
    const updates = revisions.map(async (rev) => {
        const [dataStatus, materialStatus] = await Promise.all([
            calculateDataStatus(rev.id),
            calculateMaterialStatus(rev.id)
        ])

        return supabase
            .from('engineering_revisions')
            .update({
                data_status: dataStatus,
                material_status: materialStatus
            })
            .eq('id', rev.id)
    })

    const results = await Promise.all(updates)

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
        throw new Error(`Error updating statuses: ${errors[0].error?.message}`)
    }
}
