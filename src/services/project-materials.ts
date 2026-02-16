import { createClient } from '@/lib/supabase/client'
import { ProjectMaterialItem, ProjectMaterialStats, SpoolCandidate } from '@/types/procurement'

/**
 * Buscar materiales en el catálogo del proyecto
 */
export async function searchProjectMaterials(
    projectId: string,
    query: string = ''
): Promise<ProjectMaterialItem[]> {
    const supabase = createClient()

    let supabaseQuery = supabase
        .from('project_materials')
        .select(`
            *,
            master_catalog:master_id!inner(
                id,
                commodity_code,
                category,
                component_type,
                design_standard,
                default_coating,
                is_verified
            ),
            master_dimensions:dimension_id!inner(
                nps,
                nps_decimal,
                schedule_rating,
                outside_diameter_mm,
                wall_thickness_mm,
                center_to_end_mm,
                weight_kg_unit
            )
        `)
        .eq('project_id', projectId)

    // Handle search query
    if (query) {
        supabaseQuery = supabaseQuery.or(
            `component_type.ilike.%${query}%,commodity_code.ilike.%${query}%`,
            { foreignTable: 'master_catalog' }
        )
    }

    const { data, error } = await supabaseQuery
        .order('last_used_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error searching project materials:', error.message, error.details, error.hint)
        throw error
    }

    return data as any as ProjectMaterialItem[]
}

/**
 * Obtener lista completa de materiales del proyecto
 */
export async function getProjectMaterialsList(
    projectId: string,
    options?: {
        category?: string
        limit?: number
        offset?: number
    }
): Promise<ProjectMaterialItem[]> {
    const supabase = createClient()

    let query = supabase
        .from('project_materials')
        .select(`
            *,
            master_catalog:master_id!inner(
                id,
                commodity_code,
                category,
                component_type,
                design_standard,
                default_coating,
                is_verified
            ),
            master_dimensions:dimension_id!inner(
                nps,
                nps_decimal,
                schedule_rating,
                outside_diameter_mm,
                wall_thickness_mm,
                center_to_end_mm,
                weight_kg_unit
            )
        `)
        .eq('project_id', projectId)

    // Filtrar por categoría si se especifica
    if (options?.category) {
        query = query.eq('master_catalog.category', options.category)
    }

    // Paginación
    if (options?.limit) {
        query = query.limit(options.limit)
    }
    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    query = query
        .order('category', { foreignTable: 'master_catalog', ascending: true })
        .order('nps_decimal', { foreignTable: 'master_dimensions', ascending: true })

    const { data, error } = await query

    if (error) {
        console.error('Error fetching project materials:', error.message, error.details, error.hint)
        throw error
    }

    return data as any as ProjectMaterialItem[]
}

/**
 * Obtener estadísticas de materiales del proyecto
 */
export async function getProjectMaterialStats(
    projectId: string
): Promise<ProjectMaterialStats> {
    const supabase = createClient()

    // Total de materiales y cantidad
    const { data: totals, error: totalsError } = await supabase
        .from('project_materials')
        .select('total_quantity_used')
        .eq('project_id', projectId)

    if (totalsError) {
        console.error('Error fetching material totals:', totalsError.message, totalsError.details, totalsError.hint)
        throw totalsError
    }

    const total_materials = totals?.length || 0
    const total_quantity = totals?.reduce((sum, item) => sum + item.total_quantity_used, 0) || 0

    // Agrupación por categoría
    const { data: categoryData, error: catError } = await supabase
        .from('project_materials')
        .select(`
            master_catalog:master_id!inner(category),
            total_quantity_used
        `)
        .eq('project_id', projectId)

    if (catError) {
        console.error('Error fetching category stats:', catError.message, catError.details, catError.hint)
        throw catError
    }

    const categoriesMap = new Map<string, { count: number; total_quantity: number }>()

    categoryData?.forEach(item => {
        const category = (item.master_catalog as any).category
        const current = categoriesMap.get(category) || { count: 0, total_quantity: 0 }
        categoriesMap.set(category, {
            count: current.count + 1,
            total_quantity: current.total_quantity + item.total_quantity_used
        })
    })

    const categories = Array.from(categoriesMap.entries()).map(([name, stats]) => ({
        name,
        count: stats.count,
        total_quantity: stats.total_quantity
    }))

    return {
        total_materials,
        total_quantity,
        categories
    }
}

/**
 * Actualizar campos personalizados de un material del proyecto
 */
export async function updateProjectMaterial(
    id: string,
    updates: {
        custom_fields?: any
        notes?: string
    }
): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('project_materials')
        .update({
            ...updates,
            last_used_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating project material:', error)
        throw error
    }
}

/**
 * SPOOL CANDIDATES FUNCTIONS
 */

export async function getSpoolCandidates(projectId: string): Promise<SpoolCandidate[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('spool_candidates')
        .select('*')
        .eq('project_id', projectId)
        .order('suggested_spool_number', { ascending: true })

    if (error) {
        console.error('Error fetching spool candidates:', error)
        throw error
    }
    return data as SpoolCandidate[]
}

export async function generateSpoolCandidates(projectId: string, isoNumber?: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.rpc('fn_generate_spool_candidates', {
        p_project_id: projectId,
        p_iso_number: isoNumber || null
    })

    if (error) {
        console.error('Error generating spool candidates:', error)
        throw error
    }
}

export async function approveSpoolCandidate(candidateId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.rpc('fn_approve_spool_candidate', {
        p_candidate_id: candidateId
    })

    if (error) {
        console.error('Error approving spool candidate:', error)
        throw error
    }
}

export async function rejectSpoolCandidate(candidateId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('spool_candidates')
        .update({ status: 'REJECTED' })
        .eq('id', candidateId)

    if (error) {
        console.error('Error rejecting spool candidate:', error)
        throw error
    }
}
