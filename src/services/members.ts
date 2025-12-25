import { createClient } from '@/lib/supabase/client'
import { MemberWithRelations, ApiResponse } from '@/types'

/**
 * Get all members for a specific company with their user info and assigned project
 */
export async function getMembersByCompany(companyId: string): Promise<MemberWithRelations[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('members')
            .select(`
                id,
                user_id,
                company_id,
                project_id,
                role_id,
                created_at,
                users ( email, full_name, avatar_url ),
                projects ( name, code ),
                companies ( name, slug )
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching members:', error)
            return []
        }

        // Map to standardized type
        return data.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            company_id: m.company_id,
            project_id: m.project_id,
            role_id: m.role_id,
            created_at: m.created_at,
            user: m.users,       // Joined user data
            project: m.projects, // Joined project data
            company: m.companies // Joined company data
        }))

    } catch (error) {
        console.error('Unexpected error fetching members:', error)
        return []
    }
}

/**
 * Delete a member from a company
 */
export async function deleteMember(memberId: string): Promise<ApiResponse> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId)

        if (error) throw error

        return { success: true, message: 'Usuario eliminado correctamente' }
    } catch (error: any) {
        console.error('Error deleting member:', error)
        return { success: false, message: error.message || 'Error al eliminar usuario' }
    }
}
