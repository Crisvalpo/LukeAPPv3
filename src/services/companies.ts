import { createClient } from '@/lib/supabase/client'
import type { Company, SubscriptionTierType } from '@/types'

export type { Company }

export interface CreateCompanyParams {
    name: string
    slug: string
    subscription_tier?: SubscriptionTierType
    initial_months?: number
    rut?: string
}

export interface UpdateCompanyParams {
    name?: string
    slug?: string
    rut?: string
    custom_users_limit?: number | null
    custom_projects_limit?: number | null
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

    const companies = data as Company[]

    if (!companies.length) return []

    // Fetch stats for each company
    // Note: N+1 query pattern, acceptable for low volume internal tool. 
    // For high volume, use a SQL view or RPC function.
    const companiesWithStats = await Promise.all(
        companies.map(async (company) => {
            const [projectsResult, membersResult] = await Promise.all([
                supabase.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
                supabase.from('members').select('id', { count: 'exact', head: true }).eq('company_id', company.id)
            ])

            return {
                ...company,
                projects_count: projectsResult.count || 0,
                members_count: membersResult.count || 0
            }
        })
    )

    return companiesWithStats
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
        // Check if name already exists
        const { data: existingName } = await supabase
            .from('companies')
            .select('id')
            .eq('name', params.name)
            .maybeSingle()

        if (existingName) {
            return {
                success: false,
                message: 'Ya existe una empresa con este nombre'
            }
        }

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

        // Calculate subscription end date if months provided
        let subscription_end_date: string | null = null
        if (params.initial_months && params.initial_months > 0) {
            const date = new Date()
            date.setMonth(date.getMonth() + params.initial_months)
            subscription_end_date = date.toISOString()
        }

        const { data, error } = await supabase
            .from('companies')
            .insert({
                name: params.name,
                slug: params.slug,
                subscription_tier: params.subscription_tier || 'starter',
                subscription_status: 'active',
                subscription_end_date,
                rut: params.rut || null
            })
            .select()
            .single()

        if (error) throw error

        // Initialize Storage folder structure for the company
        if (data) {
            try {
                const { getCompanyStoragePath } = await import('@/lib/storage-paths')
                const companyPath = getCompanyStoragePath({ id: data.id, slug: data.slug })
                const folders = ['logos', 'documents']

                // Upload a placeholder .keep file to each folder to initialize it
                const filePromises = folders.map(folder =>
                    supabase.storage
                        .from('project-files')
                        .upload(`${companyPath}/company/${folder}/.keep`, new Blob(['']), {
                            upsert: true
                        })
                )

                // We don't await this to avoid slowing down the response
                Promise.all(filePromises).catch(err =>
                    console.warn('Error creating company storage folders:', err)
                )
            } catch (storageError) {
                console.warn('Error initiating company storage folder creation:', storageError)
            }
        }

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

        console.log('Updating company:', id, params);

        const { data, error } = await supabase
            .from('companies')
            .update(params)
            .eq('id', id)
            .select()
            .maybeSingle() // Changed from .single() to avoid "Cannot coerce" error

        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }

        if (!data) {
            console.error('No data returned from update');
            return {
                success: false,
                message: 'No se pudo actualizar la empresa. Verifica los permisos.'
            };
        }

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

/**
 * Delete company completely (Cascade)
 * Only works if company has been suspended for > 15 days
 * This calls the secure RPC function 'delete_company_cascade'
 */
export async function deleteCompanyCascade(companyId: string): Promise<{ success: boolean; message: string; stats?: any }> {
    const supabase = createClient()

    try {
        // 1. Call the secure RPC function
        const { data: result, error } = await supabase.rpc('delete_company_cascade', {
            p_company_id: companyId
        })

        if (error) throw error

        const response = result as { success: boolean, message: string, stats?: any }

        if (!response.success) {
            return response
        }

        // 2. Storage cleanup is handled within the RPC function
        // The SQL function deletes files matching pattern: {slug}-{id}/*
        // Example: acme-construction-fd48f0e5/*
        // No additional client-side cleanup needed

        return response

    } catch (error: any) {
        console.error('Error in deleteCompanyCascade:', error)
        return {
            success: false,
            message: error.message || 'Error al eliminar empresa',
            stats: undefined
        }
    }
}
