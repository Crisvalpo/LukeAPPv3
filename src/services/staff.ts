import { createClient } from '@/lib/supabase/client'

export interface GlobalStats {
    totalCompanies: number
    totalProjects: number
    totalUsers: number
    pendingInvitations: number
}

export interface RecentCompany {
    id: string
    name: string
    slug: string
    created_at: string
    projects_count: number
    members_count: number
}

/**
 * Get global system statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
    const supabase = createClient()

    const [companiesResult, projectsResult, usersResult, invitationsResult] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('invitations').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    return {
        totalCompanies: companiesResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalUsers: usersResult.count || 0,
        pendingInvitations: invitationsResult.count || 0
    }
}

/**
 * Get recent companies with stats
 */
export async function getRecentCompanies(limit: number = 5): Promise<RecentCompany[]> {
    const supabase = createClient()

    const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error || !companies) {
        console.error('Error fetching recent companies:', error)
        return []
    }

    // Get stats for each company
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

    return companiesWithStats as RecentCompany[]
}
