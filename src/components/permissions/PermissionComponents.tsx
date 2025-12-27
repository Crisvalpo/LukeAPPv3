/**
 * Permission-Based Components
 * Reusable components for conditional rendering based on permissions
 */

'use client';

import { ReactNode } from 'react';
import { usePermissions, useCan, useHasModule } from '@/contexts/PermissionsContext';

// ==========================================
// Can Component
// ==========================================

interface CanProps {
    resource: string;
    action: string;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Conditionally render children based on permission
 * 
 * @example
 * ```tsx
 * <Can resource="joints" action="approve">
 *   <ApproveButton />
 * </Can>
 * ```
 */
export function Can({ resource, action, children, fallback = null }: CanProps) {
    const canDo = useCan(resource, action);

    return canDo ? <>{children}</> : <>{fallback}</>;
}

// ==========================================
// CanAny Component
// ==========================================

interface CanAnyProps {
    resource: string;
    actions: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Render if user has ANY of the specified permissions
 * 
 * @example
 * ```tsx
 * <CanAny resource="joints" actions={["approve", "reject"]}>
 *   <QualityControls />
 * </CanAny>
 * ```
 */
export function CanAny({ resource, actions, children, fallback = null }: CanAnyProps) {
    const { can } = usePermissions();

    const hasAny = actions.some(action => can(resource, action));

    return hasAny ? <>{children}</> : <>{fallback}</>;
}

// ==========================================
// CanAll Component
// ==========================================

interface CanAllProps {
    resource: string;
    actions: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Render if user has ALL of the specified permissions
 */
export function CanAll({ resource, actions, children, fallback = null }: CanAllProps) {
    const { can } = usePermissions();

    const hasAll = actions.every(action => can(resource, action));

    return hasAll ? <>{children}</> : <>{fallback}</>;
}

// ==========================================
// HasModule Component
// ==========================================

interface HasModuleProps {
    moduleId: string;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Conditionally render based on module access
 * 
 * @example
 * ```tsx
 * <HasModule moduleId="quality">
 *   <QualityDashboard />
 * </HasModule>
 * ```
 */
export function HasModule({ moduleId, children, fallback = null }: HasModuleProps) {
    const hasAccess = useHasModule(moduleId);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// ==========================================
// PermissionGuard Component
// ==========================================

interface PermissionGuardProps {
    children: ReactNode;
    loadingFallback?: ReactNode;
    unauthorizedFallback?: ReactNode;
}

/**
 * Guard component that shows loading/unauthorized states
 * 
 * @example
 * ```tsx
 * <PermissionGuard
 *   loadingFallback={<Spinner />}
 *   unauthorizedFallback={<AccessDenied />}
 * >
 *   <ProtectedContent />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
    children,
    loadingFallback = <div>Loading permissions...</div>,
    unauthorizedFallback = <div>Access denied</div>
}: PermissionGuardProps) {
    const { isLoading, permissions, error } = usePermissions();

    if (isLoading) {
        return <>{loadingFallback}</>;
    }

    if (error || !permissions) {
        return <>{unauthorizedFallback}</>;
    }

    return <>{children}</>;
}
