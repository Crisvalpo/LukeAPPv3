import { createClient } from '@/lib/supabase/client'

export interface Invitation {
    id: string
    email: string
    token: string
    company_id: string
    project_id?: string
    role_id: 'founder' | 'admin' | 'supervisor' | 'worker'
    status: 'pending' | 'accepted' | 'revoked' | 'expired'
    created_at: string
    expires_at: string
    accepted_at?: string
    company?: { name: string; slug: string }
    project?: { name: string; code: string }
}

export interface CreateInvitationParams {
    email: string
    company_id: string
    project_id?: string
    role_id: 'founder' | 'admin' | 'supervisor' | 'worker'
}

/**
 * Create a new invitation (Super Admin only)
 */
export async function createInvitation(params: CreateInvitationParams) {
    const supabase = createClient()

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, message: 'No autenticado' }
        }

        // Check for duplicate pending invitation
        const { data: duplicate } = await supabase
            .from('invitations')
            .select('id')
            .eq('email', params.email.toLowerCase())
            .eq('company_id', params.company_id)
            .eq('status', 'pending')
            .maybeSingle()

        if (duplicate) {
            return {
                success: false,
                message: 'Ya existe una invitación pendiente para este email'
            }
        }

        // Insert invitation
        const { data, error } = await supabase
            .from('invitations')
            .insert({
                email: params.email.toLowerCase(),
                company_id: params.company_id,
                project_id: params.project_id,
                role_id: params.role_id,
                inviter_id: user.id,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        // Generate link
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const link = `${baseUrl}/invitations/accept/${data.token}`

        return {
            success: true,
            message: 'Invitación creada exitosamente',
            data: { token: data.token, link }
        }
    } catch (error: any) {
        console.error('Error creating invitation:', error)
        return { success: false, message: error.message || 'Error al crear invitación' }
    }
}

/**
 * Get pending invitations for a company
 */
export async function getPendingInvitations(company_id?: string): Promise<Invitation[]> {
    const supabase = createClient()

    let query = supabase
        .from('invitations')
        .select(`
            *,
            company:companies(name, slug),
            project:projects(name, code)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (company_id) {
        query = query.eq('company_id', company_id)
    }

    const { data } = await query

    return (data as any[]) || []
}

/**
 * Validate invitation token
 */
export async function validateInvitationToken(token: string) {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('invitations')
            .select(`
                *,
                company:companies(name, slug),
                project:projects(name, code)
            `)
            .eq('token', token)
            .eq('status', 'pending')
            .single()

        if (error || !data) {
            return { success: false, message: 'Invitación inválida o expirada' }
        }

        return { success: true, message: 'Invitación válida', data: data as any }
    } catch (error) {
        return { success: false, message: 'Error validando invitación' }
    }
}

/**
 * Accept invitation (creates member record)
 */
export async function acceptInvitation(token: string) {
    const supabase = createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, message: 'Debes estar autenticado' }
        }

        // Call RPC function
        const { data, error } = await supabase.rpc('accept_invitation', {
            token_input: token,
            user_id_input: user.id
        })

        if (error) throw error

        return data
    } catch (error: any) {
        console.error('Error accepting invitation:', error)
        return { success: false, message: error.message || 'Error aceptando invitación' }
    }
}

/**
 * Delete invitation (hard delete from DB)
 */
export async function revokeInvitation(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id)

    if (error) return { success: false, message: error.message }
    return { success: true, message: 'Invitación eliminada' }
}

/**
 * Generate invitation link from token
 */
export function generateInvitationLink(token: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}/invitations/accept/${token}`
}
