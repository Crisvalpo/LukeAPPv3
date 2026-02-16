import { createClient } from '@/lib/supabase/client'
import { MemberWithRelations, MemberWithFunctionalRole, ApiResponse } from '@/types'

/**
 * Get all members for a specific company with their user info and assigned project
 */
export async function getMembersByCompany(companyId: string): Promise<MemberWithRelations[]> {
    const supabase = createClient()
    return fetchMembersRobust(supabase, companyId)
}

/**
 * Helper to fetch members with error handling and fallback
 * (Added to diagnose RLS/Join issues)
 */
async function fetchMembersRobust(supabase: ReturnType<typeof createClient>, companyId: string) {
    // 1. Try full query with joins
    // We use a try-catch for the promise itself just in case
    try {
        const { data, error } = await supabase
            .from('members')
            .select(`
                id,
                user_id,
                company_id,
                project_id,
                role_id,
                job_title,
                functional_role_id,
                created_at,
                users ( email, full_name, avatar_url ),
                projects ( name, code ),
                companies ( name, slug ),
                company_roles ( id, name, color, base_role, permissions )
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            return data
                .filter((m: any) => m.users?.email !== 'cristianluke@gmail.com')
                .map((m: any) => ({
                    id: m.id,
                    user_id: m.user_id,
                    company_id: m.company_id,
                    project_id: m.project_id,
                    role_id: m.role_id,
                    job_title: m.job_title,
                    functional_role_id: m.functional_role_id,
                    created_at: m.created_at,
                    user: m.users,
                    project: m.projects,
                    company: m.companies,
                    company_role: m.company_roles
                }))
        }

        // Only log if it's a real error, not just empty data
        if (error) {
            console.error('⚠️ Error fetching members with joins:', JSON.stringify(error, null, 2))
        }
    } catch (e) {
        console.error('⚠️ Exception fetching members with joins:', e)
    }

    // 2. Fallback: Fetch raw members only (to isolate RLS issues)
    console.warn('🔄 Attempting fallback fetch (no joins)...')

    try {
        const { data: rawData, error: rawError } = await supabase
            .from('members')
            .select('*')
            .eq('company_id', companyId)

        if (rawError) {
            console.error('❌ Critical: Error fetching raw members:', JSON.stringify(rawError, null, 2))
            return []
        }

        if (!rawData) return []

        // 3. Return minimal data
        return rawData.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            company_id: m.company_id,
            project_id: m.project_id,
            role_id: m.role_id,
            job_title: m.job_title,
            functional_role_id: m.functional_role_id,
            created_at: m.created_at,
            user: { email: 'Unknown (RLS Error)' },
            project: null,
            company: null,
            company_role: null
        }))
    } catch (fallbackError) {
        console.error('❌ Critical: Exception in fallback:', fallbackError)
        return []
    }
}

/**
 * Delete a member from a company
 */
export async function deleteMember(memberId: string): Promise<ApiResponse> {
    const supabase = createClient()

    try {
        // 1. Get User ID first
        const { data: member, error: fetchError } = await supabase
            .from('members')
            .select('user_id')
            .eq('id', memberId)
            .single()

        if (fetchError || !member) {
            throw new Error('Member not found')
        }

        // 2. Call Admin API to unlink member (Safe Remove)
        const response = await fetch('/api/admin/members/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId })
        })

        const result = await response.json()

        if (!response.ok) {
            // Handle Config Error (Missing Key)
            if (result.message.includes('CONFIG_ERROR')) {
                console.warn('⚠️ Server Missing Service Role Key. Falling back to simple member removal.')
                // Fallback: Just delete the member record (Client-side attempt)
                const { error: deleteError } = await supabase
                    .from('members')
                    .delete()
                    .eq('id', memberId)

                if (deleteError) throw deleteError

                return {
                    success: true,
                    message: 'Usuario removido de la empresa (Fallback)'
                }
            }
            throw new Error(result.message)
        }

        return result

    } catch (error: any) {
        console.error('Error deleting member:', error)
        return { success: false, message: error.message || 'Error al eliminar usuario' }
    }
}
