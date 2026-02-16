import { createClient } from '@/lib/supabase/client'
import { SubscriptionTierType } from '@/types'

export interface Invitation {
    id: string
    email: string
    token: string
    company_id: string
    project_id?: string
    role_id: 'super_admin' | 'founder' | 'admin' | 'supervisor' | 'worker'
    status: 'pending' | 'accepted' | 'revoked' | 'expired'
    created_at: string
    expires_at: string
    accepted_at?: string
    primary_specialty_id?: string | null
    company?: { name: string; slug: string }
    project?: { name: string; code: string }
}

export interface CreateInvitationParams {
    email: string
    company_id: string
    project_id?: string
    role_id: 'super_admin' | 'founder' | 'admin' | 'supervisor' | 'worker'
    job_title?: string
    functional_role_id?: string  // Reference to company_roles
    primary_specialty_id?: string | null
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

        if (params.role_id === 'super_admin') {
            // Verify if the inviter is actually a super_admin
            // This requires checking the 'members' table for the inviter's role in the 'lukeapp-hq' company
            // OR checks against a known system role.
            // Since we are inside the service, we can query the inviter's membership.

            const { data: inviterMembership } = await supabase
                .from('members')
                .select('role_id, company:companies(slug)')
                .eq('user_id', user.id)
                .eq('role_id', 'super_admin')
                .maybeSingle()

            // Strict check: Must be super_admin AND part of lukeapp-hq (implicitly handled by role usually, but being safe)
            if (!inviterMembership) {
                return {
                    success: false,
                    message: '⛔ ACCESO DENEGADO: Solo un Super Admin puede invitar a otro Super Admin.'
                }
            }
        }

        // --- SUBSCRIPTION USER LIMIT CHECK ---
        // Get company subscription tier, current member count, and CUSTOM LIMITS
        const { data: companyData } = await supabase
            .from('companies')
            .select('subscription_tier, custom_users_limit, members(count)')
            .eq('id', params.company_id)
            .single()

        if (companyData) {
            const tierKey = (companyData.subscription_tier as SubscriptionTierType) || 'starter'

            // 1. Get Plan Limits from Database (Platform Mindset)
            const { data: planData } = await supabase
                .from('subscription_plans')
                .select('max_users')
                .eq('id', tierKey)
                .single()

            // Fallback to safe defaults if plan not found (shouldn't happen if seeded correctly)
            const planMaxUsers = planData?.max_users || 3

            // 2. Determine Effective Limit (Override > Plan > Default)
            const maxUsers = companyData.custom_users_limit ?? planMaxUsers

            const currentMembers = (companyData.members as any)?.[0]?.count || 0

            // Note: The previous query `members(count)` might fail if RLS prevents viewing all members or syntax is slightly off for exact count.
            // Safer to do a direct count query to be 100% sure.
            const { count: exactMemberCount } = await supabase
                .from('members')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', params.company_id)

            // Check pending invitations too? Strict limit usually includes occupied seats + pending invites.
            const { count: pendingCount } = await supabase
                .from('invitations')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', params.company_id)
                .eq('status', 'pending')

            const totalOccupied = (exactMemberCount || 0) + (pendingCount || 0)

            if (totalOccupied >= maxUsers) {
                return {
                    success: false,
                    message: `⛔ LÍMITE DE PLAN: Tu plan ${tierKey} permite máximo ${maxUsers} usuarios. (Actual: ${totalOccupied} entre miembros e invitaciones).`,
                    limitReached: true
                }
            }
        }
        // -------------------------------------

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
            // STRICT LIMITS ENFORCEMENT

            // 1. Founder Limit: One Company per User
            if (params.role_id === 'founder') {
                const { data: isFounderElsewhere } = await supabase
                    .from('members')
                    .select('company:companies(name)')
                    .eq('user_id', existingUser.id)
                    .eq('role_id', 'founder')
                    .maybeSingle()

                if (isFounderElsewhere) {
                    return {
                        success: false,
                        message: `⛔ LÍMITE: Este usuario ya es Founder de ${(isFounderElsewhere.company as any)?.name}. Una cuenta Founder solo puede gestionar una empresa.`,
                        hasFounder: true
                    }
                }
            }

            // 2. Operational Limit: One Project per User (Admin, Supervisor, Worker)
            // If they have ANY role in ANY company, they are "taken" unless we want to allow cross-company?
            // User requirement: "cuentas de admin supervisor worker un proyecto"
            // This implies they shouldn't be in multiple projects.
            if (['admin', 'supervisor', 'worker'].includes(params.role_id)) {
                const { data: isBusy } = await supabase
                    .from('members')
                    .select('project:projects(name), company:companies(name)')
                    .eq('user_id', existingUser.id)
                    .maybeSingle()

                if (isBusy) {
                    return {
                        success: false,
                        message: `⛔ LÍMITE: Este usuario ya pertenece a un proyecto en ${(isBusy.company as any)?.name}. Debe ser desvinculado antes de unirse a otro.`
                    }
                }
            }

            // Original Check: Already a member of THIS company (redundant if strict limits work, but safe to keep)
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

        // Generate unique token
        const token = crypto.randomUUID()

        // Insert invitation
        const { data, error } = await supabase
            .from('invitations')
            .insert({
                email: params.email.toLowerCase(),
                token: token,
                company_id: params.company_id,
                project_id: params.project_id,
                role_id: params.role_id,
                job_title: params.job_title || null,
                functional_role_id: params.functional_role_id || null,
                primary_specialty_id: params.primary_specialty_id || null,
                invited_by: user.id,
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
export async function getPendingInvitations(company_id?: string, project_id?: string): Promise<Invitation[]> {
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

    if (project_id) {
        query = query.eq('project_id', project_id)
    }

    const { data } = await query

    return (data as any[]) || []
}

/**
 * Validate invitation token
 * UPDATED: Uses Secure RPC to bypass RLS for anonymous users
 */
export async function validateInvitationToken(token: string) {
    const supabase = createClient()

    try {
        // Use RPC instead of direct select to avoid 401 RLS error
        const { data, error } = await supabase.rpc('get_invitation_by_token', {
            token_input: token
        })

        // RPC returns an array (table), we expect a single row
        const invitation = data && data[0]

        if (error || !invitation) {
            console.error('Error validating token:', error)
            return { success: false, message: 'Invitación inválida o expirada' }
        }

        // Map RPC result to expected format
        // RPC returns: id, email, role_id, company_name, project_name, status
        const mappedData = {
            ...invitation,
            // Construct nested objects expected by UI
            company: {
                name: invitation.company_name,
                slug: 'unknown' // RPC doesn't return slug yet, but UI mostly needs name
            },
            project: invitation.project_name ? {
                name: invitation.project_name,
                code: 'unknown'
            } : null
        }

        return { success: true, message: 'Invitación válida', data: mappedData as any }
    } catch (error) {
        console.error('Exception validating token:', error)
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
