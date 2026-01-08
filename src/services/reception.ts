// Stub implementation for bodega-app ConnectionStatus
// Full implementation pending for offline queue sync

export async function syncOfflineQueue(): Promise<number> {
    console.warn('syncOfflineQueue not implemented yet - returning 0')
    return 0
}

export function getOfflineQueueStatus(): { pending: number; errors: number } {
    return {
        pending: 0,
        errors: 0
    }
}
