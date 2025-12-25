import { createClient } from '@/lib/supabase/client'

export interface Project {
    id: string
    name: string
    code: string
    description: string | null
    company_id: string
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
    created_at: string
    updated_at: string
}

export interface CreateProjectParams {
    name: string
    code: string
    description?: string
    contract_number?: string
    client_name?: string
    company_id: string
}

export interface UpdateProjectParams {
    name?: string
    code?: string
    description?: string
    status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
}

/**
 * Get all projects for a company
 */
export async function getProjectsByCompany(companyId: string): Promise<Project[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data as Project[]
}

/**
 * Get project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (error) {
        console.error('Error fetching project:', error)
        return null
    }

    return data as Project
}

/**
 * Create a new project
 */
export async function createProject(params: CreateProjectParams) {
    const supabase = createClient()

    try {
        // Check if code already exists for this company
        const { data: existingCode } = await supabase
            .from('projects')
            .select('id')
            .eq('company_id', params.company_id)
            .eq('code', params.code.toUpperCase())
            .maybeSingle()

        if (existingCode) {
            return {
                success: false,
                message: 'Ya existe un proyecto con este código en la empresa'
            }
        }

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: params.name,
                code: params.code.toUpperCase(),
                description: params.description || null,
                contract_number: params.contract_number || null,
                client_name: params.client_name || null,
                company_id: params.company_id,
                status: 'planning'
            })
            .select()
            .single()

        if (error) throw error

        return {
            success: true,
            message: 'Proyecto creado exitosamente',
            data
        }
    } catch (error: any) {
        console.error('Error creating project:', error)
        return {
            success: false,
            message: error.message || 'Error al crear proyecto'
        }
    }
}

/**
 * Update project
 */
export async function updateProject(projectId: string, params: UpdateProjectParams) {
    const supabase = createClient()

    try {
        // If updating code, check uniqueness
        if (params.code) {
            const { data: project } = await supabase
                .from('projects')
                .select('company_id')
                .eq('id', projectId)
                .single()

            if (project) {
                const { data: existingCode } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('company_id', project.company_id)
                    .eq('code', params.code.toUpperCase())
                    .neq('id', projectId)
                    .maybeSingle()

                if (existingCode) {
                    return {
                        success: false,
                        message: 'Ya existe un proyecto con este código'
                    }
                }

                params.code = params.code.toUpperCase()
            }
        }

        const { data, error } = await supabase
            .from('projects')
            .update(params)
            .eq('id', projectId)
            .select()
            .single()

        if (error) throw error

        return {
            success: true,
            message: 'Proyecto actualizado exitosamente',
            data
        }
    } catch (error: any) {
        console.error('Error updating project:', error)
        return {
            success: false,
            message: error.message || 'Error al actualizar proyecto'
        }
    }
}

/**
 * Delete project (only if no members assigned)
 */
export async function deleteProject(projectId: string) {
    const supabase = createClient()

    try {
        // Check if project has members
        const { count: membersCount } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)

        if (membersCount && membersCount > 0) {
            return {
                success: false,
                message: `No se puede eliminar. El proyecto tiene ${membersCount} miembro(s) asignado(s)`
            }
        }

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)

        if (error) throw error

        return {
            success: true,
            message: 'Proyecto eliminado exitosamente'
        }
    } catch (error: any) {
        console.error('Error deleting project:', error)
        return {
            success: false,
            message: error.message || 'Error al eliminar proyecto'
        }
    }
}

/**
 * Get project stats (members count, etc)
 */
export async function getProjectStats(projectId: string) {
    const supabase = createClient()

    const { count: membersCount } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)

    return {
        members: membersCount || 0
    }
}
