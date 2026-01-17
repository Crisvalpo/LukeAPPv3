/**
 * Permission Helper Functions
 * Utility functions for permission checking without React context
 */

import type { RolePermissions } from '@/types';

/**
 * Check if permissions allow a specific action on a resource
 */
export function canPerform(
    permissions: RolePermissions | null,
    resource: string,
    action: string
): boolean {
    if (!permissions) return false;

    const resources = permissions.resources || {};
    const resourcePerms = resources[resource];
    if (!resourcePerms) return false;

    return resourcePerms[action] === true;
}

/**
 * Check if permissions include access to a module
 */
export function hasModuleAccess(
    permissions: RolePermissions | null,
    moduleId: string
): boolean {
    if (!permissions) return false;

    const modules = permissions.modules || {};
    const moduleConfig = modules[moduleId];
    return moduleConfig?.enabled === true;
}

/**
 * Get the home module from permissions
 */
export function getHomeModule(permissions: RolePermissions | null): string | null {
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
 * Get all enabled modules
 */
export function getEnabledModules(permissions: RolePermissions | null): string[] {
    if (!permissions) return [];

    const modules = permissions.modules || {};
    return Object.entries(modules)
        .filter(([_, config]) => config?.enabled === true)
        .map(([moduleId]) => moduleId);
}

/**
 * Get all permissions for a resource
 */
export function getResourcePermissions(
    permissions: RolePermissions | null,
    resource: string
): Record<string, boolean> {
    if (!permissions) return {};

    const resources = permissions.resources || {};
    return resources[resource] || {};
}

/**
 * Check if user has ANY permission (useful for showing sections)
 */
export function hasAnyPermission(
    permissions: RolePermissions | null,
    resource: string,
    actions: string[]
): boolean {
    if (!permissions) return false;

    const resources = permissions.resources || {};
    const resourcePerms = resources[resource];
    if (!resourcePerms) return false;

    return actions.some(action => resourcePerms[action] === true);
}

/**
 * Check if user has ALL permissions (useful for complex operations)
 */
export function hasAllPermissions(
    permissions: RolePermissions | null,
    resource: string,
    actions: string[]
): boolean {
    if (!permissions) return false;

    const resources = permissions.resources || {};
    const resourcePerms = resources[resource];
    if (!resourcePerms) return false;

    return actions.every(action => resourcePerms[action] === true);
}
