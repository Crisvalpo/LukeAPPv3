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

        // Create storage folder structure in 'project-files' bucket
        // This ensures folders exist for future uploads
        if (data) {
            try {
                const basePath = `${params.company_id}/${data.id}`
                const folders = ['logos', 'structure-models', 'isometric-models', 'drawings', 'photos']

                // Upload a placeholder .keep file to each folder to initialize it
                // Supabase Storage creates folders on demand when files are uploaded
                const filePromises = folders.map(folder =>
                    supabase.storage
                        .from('project-files')
                        .upload(`${basePath}/${folder}/.keep`, new Blob(['']), {
                            upsert: true
                        })
                )

                // We don't await this to avoid slowing down the response
                // It runs in the background
                Promise.all(filePromises).catch(err =>
                    console.warn('Error creating storage folders:', err)
                )
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
): Promise<{ success: boolean; stats?: ProjectDeletionStats; error?: string }> {
    const supabase = createClient()

    try {
        // ==========================================
        // STORAGE CLEANUP - Consolidated Structure
        // ==========================================
        // Bucket: 'project-files'
        // Structure: {company_id}/{project_id}/...
        // We attempt to clean the entire project folder.

        try {
            const projectPath = `${companyId}/${projectId}`
            // We need to list contents. Listing at project root might work if files are directly there, 
            // but usually they are in subfolders.
            // Known subfolders:
            const subfolders = ['logos', 'structure-models', 'isometric-models', 'drawings', 'photos']

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

            // Also try cleaning root (for .keep files etc)
            const { data: rootFiles } = await supabase.storage.from('project-files').list(projectPath)
            if (rootFiles && rootFiles.length > 0) {
                const rootPaths = rootFiles
                    .filter(f => f.name !== '.emptyFolderPlaceholder') // optional filter
                    .map(f => `${projectPath}/${f.name}`)
                if (rootPaths.length > 0) {
                    await supabase.storage.from('project-files').remove(rootPaths)
                }
            }

        } catch (storageError) {
            console.warn('Error cleaning up project-files:', storageError)
        }

        // ==========================================
        // DATABASE CLEANUP - Call RPC function
        // ==========================================
        // Call RPC function to delete project and get stats
        const { data: stats, error: rpcError } = await supabase
            .rpc('delete_project_complete', {
                p_project_id: projectId,
                p_company_id: companyId
            })
            .single()

        if (rpcError) throw rpcError

        // Delete all files from Storage bucket for this project
        // Pattern: company_id/project_id/*
        const storagePath = `${companyId}/${projectId}`

        // List all files in project folder
        const { data: files, error: listError } = await supabase.storage
            .from('project-files')
            .list(storagePath, {
                limit: 1000,
                sortBy: { column: 'name', order: 'asc' }
            })

        if (!listError && files && files.length > 0) {
            // Delete all files
            const filePaths = files.map(file => `${storagePath}/${file.name}`)
            const { error: deleteError } = await supabase.storage
                .from('project-files')
                .remove(filePaths)

            if (deleteError) {
                console.warn('Error deleting some storage files:', deleteError)
            }
        }

        return {
            success: true,
            stats: stats as ProjectDeletionStats
        }
    } catch (error: any) {
        console.error('Error deleting project:', error)
        return {
            success: false,
            error: error.message || 'Error al eliminar proyecto'
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
