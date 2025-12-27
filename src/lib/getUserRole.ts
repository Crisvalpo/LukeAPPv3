/**
 * Helper to get user's functional role and permissions
 * For use in middleware and server components
 */

import { createClient } from '@/lib/supabase/server';
import type { CompanyRole, RolePermissions } from '@/types';
import { getHomeModule } from '@/lib/permissions';
import { MODULES } from '@/constants/modules';

interface UserRoleData {
    role: CompanyRole | null;
    permissions: RolePermissions | null;
    homeModule: string | null;
    homeRoute: string | null;
}

/**
 * Get user's role and permissions from the database
 * Returns null if user is not authenticated or has no role
 */
export async function getUserRoleData(): Promise<UserRoleData> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                role: null,
                permissions: null,
                homeModule: null,
                homeRoute: null
            };
        }

        // Get user's membership with functional role
        const { data: member, error: memberError } = await supabase
            .from('members')
            .select(`
        *,
        company_roles (
          id,
          name,
          description,
          color,
          base_role,
          permissions
        )
      `)
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

        if (memberError || !member) {
            return {
                role: null,
                permissions: null,
                homeModule: null,
                homeRoute: null
            };
        }

        // Extract role and permissions
        const functionalRole = (member as any).company_roles as CompanyRole | null;

        if (!functionalRole) {
            return {
                role: null,
                permissions: null,
                homeModule: null,
                homeRoute: null
            };
        }

        const permissions = functionalRole.permissions;
        const homeModuleId = getHomeModule(permissions);
        let homeRoute = null;

        if (homeModuleId) {
            const module = Object.values(MODULES).find(m => m.id === homeModuleId);
            homeRoute = module?.routes.home || null;
        }

        return {
            role: functionalRole,
            permissions,
            homeModule: homeModuleId,
            homeRoute
        };
    } catch (error) {
        console.error('Error getting user role data:', error);
        return {
            role: null,
            permissions: null,
            homeModule: null,
            homeRoute: null
        };
    }
}

/**
 * Check if user has access to a specific route based on permissions
 */
export async function canAccessRoute(pathname: string): Promise<boolean> {
    const { permissions } = await getUserRoleData();

    if (!permissions) {
        return false;
    }

    // Extract module from pathname (e.g., /quality/dashboard -> quality)
    const pathParts = pathname.split('/').filter(Boolean);
    const moduleId = pathParts[0];

    if (!moduleId) {
        return true; // Allow root paths
    }

    // Check if user has access to this module
    const moduleConfig = permissions.modules[moduleId];
    return moduleConfig?.enabled === true;
}
