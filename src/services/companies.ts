import { createClient } from '@/lib/supabase/client'

export interface Company {
    id: string
    name: string
    slug: string
    created_at: string
    updated_at: string
}

export interface CreateCompanyParams {
    name: string
    slug: string
}

export interface UpdateCompanyParams {
    name?: string
    slug?: string
}

/**
 * Get all companies (Super Admin only)
 */
export async function getAllCompanies(): Promise<Company[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching companies:', error)
        return []
    }

    return data as Company[]
}

/**
 * Get company by ID
 */
export async function getCompanyById(id: string): Promise<Company | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching company:', error)
        return null
    }

    return data as Company
}

/**
 * Create a new company (Super Admin only)
 */
export async function createCompany(params: CreateCompanyParams) {
    const supabase = createClient()

    try {
        // Check if slug already exists
        const { data: existing } = await supabase
            .from('companies')
            .select('id')
            .eq('slug', params.slug)
            .maybeSingle()

        if (existing) {
            return {
                success: false,
                message: 'Ya existe una empresa con este slug'
            }
        }

        const { data, error } = await supabase
            .from('companies')
            .insert({
                name: params.name,
                slug: params.slug
            })
            .select()
            .single()

        if (error) throw error

        return {
            success: true,
            message: 'Empresa creada exitosamente',
            data
        }
    } catch (error: any) {
        console.error('Error creating company:', error)
        return {
            success: false,
            message: error.message || 'Error al crear empresa'
        }
    }
}

/**
 * Update company
 */
export async function updateCompany(id: string, params: UpdateCompanyParams) {
    const supabase = createClient()

    try {
        // If updating slug, check it doesn't exist
        if (params.slug) {
            const { data: existing } = await supabase
                .from('companies')
                .select('id')
                .eq('slug', params.slug)
                .neq('id', id)
                .maybeSingle()

            if (existing) {
                return {
                    success: false,
                    message: 'Ya existe una empresa con este slug'
                }
            }
        }

        const { data, error } = await supabase
            .from('companies')
            .update(params)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return {
            success: true,
            message: 'Empresa actualizada exitosamente',
            data
        }
    } catch (error: any) {
        console.error('Error updating company:', error)
        return {
            success: false,
            message: error.message || 'Error al actualizar empresa'
        }
    }
}

/**
 * Delete company (Super Admin only)
 * Note: This is a hard delete. Consider soft delete in production.
 */
export async function deleteCompany(id: string) {
    const supabase = createClient()

    try {
        // Check if company has projects
        const { count: projectsCount } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', id)

        if (projectsCount && projectsCount > 0) {
            return {
                success: false,
                message: `No se puede eliminar. La empresa tiene ${projectsCount} proyecto(s) asociado(s)`
            }
        }

        // Check if company has members
        const { count: membersCount } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', id)

        if (membersCount && membersCount > 0) {
            return {
                success: false,
                message: `No se puede eliminar. La empresa tiene ${membersCount} miembro(s) activo(s)`
            }
        }

        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id)

        if (error) throw error

        return {
            success: true,
            message: 'Empresa eliminada exitosamente'
        }
    } catch (error: any) {
        console.error('Error deleting company:', error)
        return {
            success: false,
            message: error.message || 'Error al eliminar empresa'
        }
    }
}

/**
 * Get company stats (projects count, members count)
 */
export async function getCompanyStats(companyId: string) {
    const supabase = createClient()

    const [projectsResult, membersResult] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
    ])

    return {
        projects: projectsResult.count || 0,
        members: membersResult.count || 0
    }
}
