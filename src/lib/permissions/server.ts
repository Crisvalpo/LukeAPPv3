import { createClient } from '@/lib/supabase/server'
import type { RolePermissions } from '@/types'

/**
 * Get the current user's functional role permissions
 * Use this in Server Components or Server Actions
 */
export async function getUserPermissions(): Promise<RolePermissions | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('members')
        .select('company_roles(permissions)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .maybeSingle()

    const permissions = (data as any)?.company_roles?.permissions
    return permissions || null
}

/**
 * Check if user has a specific permission on a resource
 * @param resource - Resource name (e.g., 'joints', 'test_packs')
 * @param action - Action name (e.g., 'view', 'create', 'approve')
 */
export async function can(resource: string, action: string): Promise<boolean> {
    const permissions = await getUserPermissions()
    if (!permissions) return false

    return permissions.resources?.[resource]?.[action] === true
}

/**
 * Check if user has a specific module enabled
 * @param moduleName - Module name (e.g., 'quality', 'field', 'warehouse')
 */
export async function hasModule(moduleName: string): Promise<boolean> {
    const permissions = await getUserPermissions()
    if (!permissions) return false

    return permissions.modules?.[moduleName]?.enabled === true
}

/**
 * Get the user's home module (the one marked as is_home: true)
 */
export async function getHomeModule(): Promise<string | null> {
    const permissions = await getUserPermissions()
    if (!permissions || !permissions.modules) return null

    const homeModule = Object.entries(permissions.modules)
        .find(([_, config]) => config.is_home === true)?.[0]

    return homeModule || null
}

/**
 * Get full user role data including functional role name and system role
 */
export async function getUserRoleData(): Promise<{
    systemRole: string | null
    functionalRole: string | null
    permissions: RolePermissions | null
} | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('members')
        .select(`
            role_id,
            company_roles (
                name,
                permissions
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .maybeSingle()

    if (!data) return null

    return {
        systemRole: (data as any).role_id || null,
        functionalRole: (data as any).company_roles?.name || null,
        permissions: (data as any).company_roles?.permissions || null
    }
}
