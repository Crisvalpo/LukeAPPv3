/**
 * User Context Manager
 * Manages offline session persistence with work-shift validity (12 hours)
 */

import { createClient } from '@/lib/supabase/client'

const USER_CONTEXT_KEY = 'LUKAPP_USER_CONTEXT'
const LAST_SYNC_KEY = 'LUKAPP_LAST_SYNC'
const SESSION_VALIDITY_HOURS = 12 // Jornada laboral

export interface UserContext {
    userId: string
    email: string
    projectId: string
    projectName?: string
    companyId?: string
    role: string
    jobTitle?: string
    cachedAt: number
}

export interface SyncStatus {
    lastSync: number | null
    pendingCount: number
    errorCount: number
}

/**
 * Save user context to localStorage after successful login
 */
export function saveUserContext(context: Omit<UserContext, 'cachedAt'>) {
    const fullContext: UserContext = {
        ...context,
        cachedAt: Date.now()
    }
    localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(fullContext))
    console.log('✅ User context saved to cache')
}

/**
 * Get cached user context
 * Returns null if not found or expired
 */
export function getCachedUserContext(): UserContext | null {
    try {
        const cached = localStorage.getItem(USER_CONTEXT_KEY)
        if (!cached) return null

        const context: UserContext = JSON.parse(cached)

        // Check if cache is still valid (within work shift)
        const hoursElapsed = (Date.now() - context.cachedAt) / (1000 * 60 * 60)

        if (hoursElapsed > SESSION_VALIDITY_HOURS) {
            console.warn(`⚠️ Session expired (${hoursElapsed.toFixed(1)}h > ${SESSION_VALIDITY_HOURS}h)`)
            return null
        }

        console.log(`✅ Using cached context (${hoursElapsed.toFixed(1)}h old)`)
        return context
    } catch (e) {
        console.error('Failed to read user context:', e)
        return null
    }
}

/**
 * Clear user context (logout)
 */
export function clearUserContext() {
    localStorage.removeItem(USER_CONTEXT_KEY)
    console.log('🗑️ User context cleared')
}

/**
 * Update last sync timestamp
 */
export function updateLastSync() {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString())
}

/**
 * Get last sync status
 */
export function getLastSyncTime(): number | null {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY)
    return lastSync ? parseInt(lastSync) : null
}

/**
 * Attempt to refresh session silently
 * Call this when app comes online
 */
export async function attemptSessionRefresh(): Promise<boolean> {
    try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.refreshSession()

        if (error || !data.session) {
            console.warn('⚠️ Session refresh failed:', error?.message)
            return false
        }

        console.log('✅ Session refreshed successfully')

        // Update cached timestamp to extend validity
        const cached = getCachedUserContext()
        if (cached) {
            saveUserContext({
                userId: cached.userId,
                email: cached.email,
                projectId: cached.projectId,
                projectName: cached.projectName,
                companyId: cached.companyId,
                role: cached.role,
                jobTitle: cached.jobTitle
            })
        }

        return true
    } catch (e) {
        console.error('Session refresh error:', e)
        return false
    }
}

/**
 * Check if session needs refresh (approaching expiry)
 * Returns true if within 2 hours of expiry
 */
export function needsSessionRefresh(): boolean {
    const cached = getCachedUserContext()
    if (!cached) return false

    const hoursElapsed = (Date.now() - cached.cachedAt) / (1000 * 60 * 60)
    return hoursElapsed > (SESSION_VALIDITY_HOURS - 2) // Refresh 2 hours before expiry
}

/**
 * Format time elapsed for display
 */
export function formatTimeElapsed(timestamp: number): string {
    const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60))

    if (minutes < 1) return 'Justo ahora'
    if (minutes < 60) return `Hace ${minutes} min`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours}h`

    const days = Math.floor(hours / 24)
    return `Hace ${days} días`
}
