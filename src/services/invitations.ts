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
    job_title?: string
    functional_role_id?: string  // Reference to company_roles
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

        // Check if company already has a founder (only for founder invitations)
        if (params.role_id === 'founder') {
            const { count } = await supabase
                .from('members')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', params.company_id)
                .eq('role_id', 'founder')

            if (count && count > 0) {
                return {
                    success: false,
                    message: '⚠️ Esta empresa ya tiene un founder asignado. ¿Realmente necesitas invitar otro?',
                    hasFounder: true
                }
            }
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

        // Check if user already exists and is a member
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', params.email.toLowerCase())
            .maybeSingle()

        if (existingUser) {
            // User exists in auth, check if already a member
            const { data: existingMember } = await supabase
                .from('members')
                .select('id, role_id')
                .eq('user_id', existingUser.id)
                .eq('company_id', params.company_id)
                .maybeSingle()

            if (existingMember) {
                return {
                    success: false,
                    message: `Este usuario ya es ${existingMember.role_id} de la empresa`
                }
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
                job_title: params.job_title || null,
                functional_role_id: params.functional_role_id || null,
                inviter_id: user.id,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error creating invitation:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error
            })
            throw error
        }

        // Generate link
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const link = `${baseUrl}/invitations/accept/${data.token}`

        return {
            success: true,
            message: 'Invitación creada exitosamente',
            data: { token: data.token, link }
        }
    } catch (error: any) {
        console.error('Error creating invitation:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            name: error?.name,
            fullError: error
        })
        return {
            success: false,
            message: error?.message || error?.hint || 'Error al crear invitación'
        }
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
 * Now optionally cleans up "zombie" users (unconfirmed) via API
 */
export async function revokeInvitation(id: string, email?: string) {
    const supabase = createClient()

    try {
        // Try the new API for deep cleaning
        const response = await fetch('/api/invitations/revoke-clean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitationId: id, userEmail: email })
        })

        if (!response.ok) {
            console.warn('⚠️ Server API Revoke failed, falling back to client-side delete.')
            throw new Error('API Failed')
        }

        const result = await response.json()
        return result

    } catch (e) {
        // Fallback: Standard delete
        const { error } = await supabase
            .from('invitations')
            .delete()
            .eq('id', id)

        if (error) return { success: false, message: error.message }
        return { success: true, message: 'Invitación eliminada (Limpieza básica)' }
    }
}

/**
 * Generate invitation link from token
 */
export function generateInvitationLink(token: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}/invitations/accept/${token}`
}
