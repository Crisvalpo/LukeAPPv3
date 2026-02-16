import { createClient } from '@/lib/supabase/client'
import { getProjectStoragePath, getCompanyStoragePath } from '@/lib/storage-paths'

export interface Project {
    id: string
    name: string
    code: string
    description: string | null
    company_id: string
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
    created_at: string
    updated_at: string
    start_date?: string
    week_end_day?: number
    logo_primary_url?: string | null
    logo_secondary_url?: string | null
    logo_primary_crop?: any
    logo_secondary_crop?: any
}

export interface CreateProjectParams {
    name: string
    code: string
    description?: string
    contract_number?: string
    client_name?: string
    company_id: string
    specialty_ids?: string[] // NEW: List of specialties to activate
}

export interface UpdateProjectParams {
    name?: string
    code?: string
    description?: string
    status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
}

export interface ProjectDeletionStats {
    project_name: string
    project_code: string
    members: number
    orphan_users: number
    deleted_auth_users: number
    isometrics: number
    spools: number
    master_views: number
    revisions: number
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

        // Check Project Limits
        const { data: company } = await supabase
            .from('companies')
            .select(`
                custom_projects_limit,
                subscription_plans (
                    max_projects
                )
            `)
            .eq('id', params.company_id)
            .single()

        if (company) {
            // @ts-ignore
            const maxProjects = company.custom_projects_limit ?? company.subscription_plans?.max_projects ?? 999

            const { count } = await supabase
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', params.company_id)

            if (count !== null && count >= maxProjects) {
                return {
                    success: false,
                    message: `Límite de proyectos alcanzado (${count}/${maxProjects}). Actualiza tu plan o contacta a soporte.`
                }
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

        // Activate specialties
        if (data && params.specialty_ids && params.specialty_ids.length > 0) {
            const specialtyRecords = params.specialty_ids.map(specialtyId => ({
                project_id: data.id,
                specialty_id: specialtyId,
                is_active: true
            }))

            const { error: specError } = await supabase
                .from('project_specialties')
                .insert(specialtyRecords)

            if (specError) {
                console.error('Error activating project specialties:', specError)
            }
        }

        // Create storage folder structure in 'project-files' bucket
        // This ensures folders exist for future uploads
        if (data) {
            try {
                // Get full company info for path generation
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('id, slug')
                    .eq('id', params.company_id)
                    .single()

                if (companyData) {
                    const company = { id: companyData.id, slug: companyData.slug }
                    const project = { id: data.id, code: data.code, name: data.name }
                    const basePath = getProjectStoragePath(company, project)
                    const folders = ['logos', 'structure-models', 'isometric-models', 'drawings', 'photos']

                    // Upload a placeholder .keep file to each folder to initialize it
                    const filePromises = folders.map(folder =>
                        supabase.storage
                            .from('project-files')
                            .upload(`${basePath}/${folder}/.keep`, new Blob(['']), {
                                upsert: true
                            })
                    )

                    // We don't await this to avoid slowing down the response
                    Promise.all(filePromises).catch(err =>
                        console.warn('Error creating storage folders:', err)
                    )
                }
            } catch (storageError) {
                console.warn('Error initiating storage folder creation:', storageError)
            }
        }

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
 * Delete project completely (database + storage + orphan auth users)
 * This will:
 * 1. Delete users who only belong to this project from auth.users
 * 2. Delete all files from Storage bucket
 * 3. Delete all database records via CASCADE
 */
export async function deleteProjectComplete(
    projectId: string,
    companyId: string
): Promise<{ success: boolean; stats?: ProjectDeletionStats; error?: string; message?: string }> {
    const supabase = createClient()

    try {
        // 1. Fetch project details needed for storage path
        const { data: projectData, error: fetchError } = await supabase
            .from('projects')
            .select('id, code, name, company_id, companies(id, slug)')
            .eq('id', projectId)
            .single()

        if (fetchError || !projectData) {
            // If project not found in DB, it might be already deleted or we just can't find it.
            // We can try to proceed with RPC deletion just in case, or fail.
            // But we need the slug to clean storage. 
            // If we can't get it, we can't clean storage efficiently with the new path system.
            console.warn('Could not fetch project details for storage cleanup. Proceeding to DB delete only.')
        } else {
            // ==========================================
            // STORAGE CLEANUP
            // ==========================================
            try {
                // @ts-ignore
                const company = { id: projectData.companies.id, slug: projectData.companies.slug }
                const project = { id: projectData.id, code: projectData.code, name: projectData.name }

                // Get the root folder for this project: {slug}-{id}/{code}-{id}
                const projectPath = getProjectStoragePath(company, project)

                console.log('Cleaning up project storage at:', projectPath)

                // Subfolders to clean
                const subfolders = ['logos', 'structure-models', 'isometric-models', 'drawings', 'photos', 'isometric-pdfs']

                for (const folder of subfolders) {
                    const folderPath = `${projectPath}/${folder}`
                    const { data: files } = await supabase.storage
                        .from('project-files')
                        .list(folderPath, { limit: 100 })

                    if (files && files.length > 0) {
                        const paths = files.map(f => `${folderPath}/${f.name}`)
                        await supabase.storage.from('project-files').remove(paths)
                    }
                }

                // Also try cleaning root of project folder
                const { data: rootFiles } = await supabase.storage.from('project-files').list(projectPath)
                if (rootFiles && rootFiles.length > 0) {
                    const rootPaths = rootFiles
                        .filter(f => f.name !== '.emptyFolderPlaceholder')
                        .map(f => `${projectPath}/${f.name}`)
                    if (rootPaths.length > 0) {
                        await supabase.storage.from('project-files').remove(rootPaths)
                    }
                }

            } catch (storageError) {
                console.warn('Error cleaning up project-files:', storageError)
            }
        }

        // ==========================================
        // DATABASE CLEANUP
        // ==========================================
        const { data: stats, error: rpcError } = await supabase
            .rpc('delete_project_complete', {
                p_project_id: projectId,
                p_company_id: companyId
            })
            .single()

        if (rpcError) throw rpcError

        return {
            success: true,
            stats: stats as ProjectDeletionStats
        }
    } catch (error: any) {
        console.error('Error deleting project:', error)
        return {
            success: false,
            error: error.message || 'Error al eliminar proyecto',
            message: error.message || 'Error al eliminar proyecto',
            stats: undefined
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
