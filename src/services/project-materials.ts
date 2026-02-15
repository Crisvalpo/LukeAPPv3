/**
 * Project Materials Service
 * 
 * Gestiona el catálogo de materiales filtrado por proyecto.
 * Los usuarios solo ven materiales USADOS en su proyecto específico.
 * 
 * La tabla project_materials se auto-puebla desde project_mto y spools_mto.
 */

import { createClient } from '@/lib/supabase/client'

// =====================================================
// TYPES
// =====================================================

export interface ProjectMaterialItem {
    id: string
    project_id: string
    company_id: string
    master_id: string
    dimension_id: string
    first_seen_at: string
    last_used_at: string
    total_quantity_used: number
    project_item_code?: string
    project_notes?: string

    // Joined data from master_catalog
    master_catalog?: {
        commodity_code: string
        category: string
        component_type: string
        design_standard: string
        default_coating?: string
    }

    // Joined data from master_dimensions
    master_dimensions?: {
        nps: string
        nps_decimal: number
        schedule_rating?: string
        outside_diameter_mm?: number
        wall_thickness_mm?: number
        center_to_end_mm?: number
        weight_kg_unit?: number
    }
}

export interface ProjectMaterialStats {
    total_materials: number
    total_quantity: number
    categories: {
        category: string
        count: number
        total_quantity: number
    }[]
    recently_used: ProjectMaterialItem[]
}

// =====================================================
// SEARCH & RETRIEVAL
// =====================================================

/**
 * Buscar materiales DEL PROYECTO (no de la librería global)
 * Solo retorna materiales que ya han sido usados en este proyecto
 */
export async function searchProjectMaterials(
    projectId: string,
    query: string
): Promise<ProjectMaterialItem[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_materials')
        .select(`
      *,
      master_catalog!inner(
        commodity_code,
        category,
        component_type,
        design_standard,
        default_coating
      ),
      master_dimensions!inner(
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
        .or(`master_catalog.component_type.ilike.%${query}%,master_catalog.commodity_code.ilike.%${query}%,master_dimensions.nps.ilike.%${query}%`)
        .order('last_used_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error searching project materials:', error)
        throw error
    }

    return data as ProjectMaterialItem[]
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
      master_catalog!inner(
        commodity_code,
        category,
        component_type,
        design_standard,
        default_coating
      ),
      master_dimensions!inner(
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

    query = query.order('master_catalog.category', { ascending: true })
        .order('master_dimensions.nps_decimal', { ascending: true })

    const { data, error } = await query

    if (error) {
        console.error('Error fetching project materials:', error)
        throw error
    }

    return data as ProjectMaterialItem[]
}

/**
 * Obtener estadísticas de materiales del proyecto
 */
export async function getProjectMaterialStats(
    projectId: string
): Promise<ProjectMaterialStats> {
    const supabase = createClient()

    // Total de materiales y cantidad
    const { data: totals } = await supabase
        .from('project_materials')
        .select('total_quantity_used')
        .eq('project_id', projectId)

    const total_materials = totals?.length || 0
    const total_quantity = totals?.reduce((sum, item) => sum + item.total_quantity_used, 0) || 0

    // Agrupación por categoría
    const { data: categoryData } = await supabase
        .from('project_materials')
        .select(`
      master_catalog!inner(category),
      total_quantity_used
    `)
        .eq('project_id', projectId)

    const categoriesMap = new Map<string, { count: number; total_quantity: number }>()

    categoryData?.forEach(item => {
        const category = (item.master_catalog as any).category
        const existing = categoriesMap.get(category) || { count: 0, total_quantity: 0 }
        categoriesMap.set(category, {
            count: existing.count + 1,
            total_quantity: existing.total_quantity + item.total_quantity_used
        })
    })

    const categories = Array.from(categoriesMap.entries()).map(([category, stats]) => ({
        category,
        ...stats
    }))

    // Materiales usados recientemente
    const recently_used = await getProjectMaterialsList(projectId, { limit: 10 })

    return {
        total_materials,
        total_quantity,
        categories,
        recently_used
    }
}

// =====================================================
// MANAGEMENT
// =====================================================

/**
 * Agregar material al proyecto manualmente (desde librería global)
 * Nota: Normalmente los materiales se agregan automáticamente via triggers
 */
export async function addMaterialToProject(
    projectId: string,
    dimensionId: string,
    options?: {
        project_item_code?: string
        project_notes?: string
    }
): Promise<void> {
    const supabase = createClient()

    // Obtener master_id y company_id
    const { data: dimension } = await supabase
        .from('master_dimensions')
        .select('master_id')
        .eq('id', dimensionId)
        .single()

    if (!dimension) {
        throw new Error('Dimension not found')
    }

    const { data: project } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()

    if (!project) {
        throw new Error('Project not found')
    }

    // Insertar en project_materials
    const { error } = await supabase
        .from('project_materials')
        .insert({
            project_id: projectId,
            company_id: project.company_id,
            master_id: dimension.master_id,
            dimension_id: dimensionId,
            project_item_code: options?.project_item_code,
            project_notes: options?.project_notes
        })

    if (error) {
        console.error('Error adding material to project:', error)
        throw error
    }
}

/**
 * Actualizar campos personalizados del material en el proyecto
 */
export async function updateProjectMaterial(
    materialId: string,
    updates: {
        project_item_code?: string
        project_notes?: string
    }
): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('project_materials')
        .update(updates)
        .eq('id', materialId)

    if (error) {
        console.error('Error updating project material:', error)
        throw error
    }
}

/**
 * Eliminar material del proyecto
 * Nota: Solo elimina de project_materials, no afecta project_mto ni spools_mto
 */
export async function removeProjectMaterial(materialId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', materialId)

    if (error) {
        console.error('Error removing project material:', error)
        throw error
    }
}

// =====================================================
// UTILITY
// =====================================================

/**
 * Obtener material específico por dimension_id
 */
export async function getProjectMaterialByDimension(
    projectId: string,
    dimensionId: string
): Promise<ProjectMaterialItem | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_materials')
        .select(`
      *,
      master_catalog!inner(
        commodity_code,
        category,
        component_type,
        design_standard,
        default_coating
      ),
      master_dimensions!inner(
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
        .eq('dimension_id', dimensionId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null
        }
        console.error('Error fetching project material:', error)
        throw error
    }

    return data as ProjectMaterialItem
}
