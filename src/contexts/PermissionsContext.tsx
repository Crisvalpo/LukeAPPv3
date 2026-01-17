'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CompanyRole, RolePermissions } from '@/types';

// ==========================================
// TYPES
// ==========================================

interface PermissionsContextValue {
    permissions: RolePermissions | null;
    role: CompanyRole | null;
    isLoading: boolean;
    error: string | null;

    // Helper functions
    can: (resource: string, action: string) => boolean;
    hasModule: (moduleId: string) => boolean;
    getHomeModule: () => string | null;
    refresh: () => Promise<void>;
}

// ==========================================
// CONTEXT
// ==========================================

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

// ==========================================
// PROVIDER
// ==========================================

interface PermissionsProviderProps {
    children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
    const [role, setRole] = useState<CompanyRole | null>(null);
    const [permissions, setPermissions] = useState<RolePermissions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUserPermissions();
    }, []);

    async function loadUserPermissions() {
        try {
            setIsLoading(true);
            setError(null);

            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setPermissions(null);
                setRole(null);
                setIsLoading(false);
                return;
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

            if (memberError) {
                throw memberError;
            }

            if (!member) {
                // User has no membership yet
                setPermissions(null);
                setRole(null);
                setIsLoading(false);
                return;
            }

            // Extract role and permissions
            const functionalRole = (member as any).company_roles;

            if (functionalRole) {
                setRole(functionalRole);
                setPermissions(functionalRole.permissions);
            } else {
                // No functional role assigned - use default empty permissions
                setRole(null);
                setPermissions({
                    modules: {},
                    resources: {}
                });
            }

            setIsLoading(false);
        } catch (err: any) {
            console.error('Error loading permissions:', err);
            setError(err.message || 'Error al cargar permisos');
            setIsLoading(false);
        }
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    /**
     * Check if user has permission for a specific action on a resource
     */
    function can(resource: string, action: string): boolean {
        if (!permissions) return false;

        const resources = permissions.resources || {};
        const resourcePerms = resources[resource];
        if (!resourcePerms) return false;

        return resourcePerms[action] === true;
    }

    /**
     * Check if user has access to a specific module
     */
    function hasModule(moduleId: string): boolean {
        if (!permissions) return false;

        const modules = permissions.modules || {};
        const moduleConfig = modules[moduleId];
        return moduleConfig?.enabled === true;
    }

    /**
     * Get the user's home module (for routing)
     */
    function getHomeModule(): string | null {
        if (!permissions) return null;

        const modules = permissions.modules || {};

        for (const [moduleId, config] of Object.entries(modules)) {
            if (config?.is_home === true) {
                return moduleId;
            }
        }

        // Fallback: return first enabled module
        for (const [moduleId, config] of Object.entries(modules)) {
            if (config?.enabled === true) {
                return moduleId;
            }
        }

        return null;
    }

    /**
     * Refresh permissions (useful after role changes)
     */
    async function refresh() {
        await loadUserPermissions();
    }

    const value: PermissionsContextValue = {
        permissions,
        role,
        isLoading,
        error,
        can,
        hasModule,
        getHomeModule,
        refresh
    };

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}

// ==========================================
// HOOK
// ==========================================

/**
 * Hook to access user permissions
 * 
 * @example
 * ```tsx
 * const { can, hasModule, getHomeModule } = usePermissions();
 * 
 * if (can('joints', 'approve')) {
 *   return <ApproveButton />;
 * }
 * 
 * if (hasModule('quality')) {
 *   return <QualityDashboard />;
 * }
 * ```
 */
export function usePermissions() {
    const context = useContext(PermissionsContext);

    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }

    return context;
}

// ==========================================
// CONVENIENCE HOOKS
// ==========================================

/**
 * Hook to check a specific permission
 * Returns true/false immediately (no loading state)
 */
export function useCan(resource: string, action: string): boolean {
    const { can } = usePermissions();
    return can(resource, action);
}

/**
 * Hook to check module access
 * Returns true/false immediately (no loading state)
 */
export function useHasModule(moduleId: string): boolean {
    const { hasModule } = usePermissions();
    return hasModule(moduleId);
}
