'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { syncOfflineQueue, getOfflineQueueStatus } from '@/services/reception'
import { attemptSessionRefresh, needsSessionRefresh, updateLastSync } from '@/lib/user-context'

export default function ConnectionStatus() {
    const [isOnline, setIsOnline] = useState(true)
    const [queueStatus, setQueueStatus] = useState({ pending: 0, errors: 0 })
    const [syncing, setSyncing] = useState(false)
    const [justSynced, setJustSynced] = useState(false)

    useEffect(() => {
        // Initial status
        setIsOnline(navigator.onLine)
        updateQueueStatus()

        // Listen for online/offline events
        const handleOnline = async () => {
            setIsOnline(true)
            console.log('📶 Conexión restaurada')

            // Auto-refresh session if needed
            if (needsSessionRefresh()) {
                console.log('🔄 Refreshing session...')
                await attemptSessionRefresh()
            }

            // Auto-sync queue
            await handleSync(true)
        }

        const handleOffline = () => {
            setIsOnline(false)
            console.log('📵 Sin conexión')
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Update queue status every 30 seconds
        const interval = setInterval(() => {
            updateQueueStatus()
        }, 30000)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            clearInterval(interval)
        }
    }, [])

    const updateQueueStatus = () => {
        const status = getOfflineQueueStatus()
        setQueueStatus(status)
    }

    const handleSync = async (isAuto = false) => {
        if (!isOnline || syncing) return

        setSyncing(true)
        setJustSynced(false)

        try {
            const syncedCount = await syncOfflineQueue()

            if (syncedCount > 0) {
                console.log(`✅ Sincronizados ${syncedCount} registros`)
                setJustSynced(true)
                setTimeout(() => setJustSynced(false), 3000)
            }

            // Update last sync time
            updateLastSync()
            updateQueueStatus()
        } catch (error) {
            console.error('❌ Sync failed:', error)
        } finally {
            setSyncing(false)
        }
    }

    const showBadge = queueStatus.pending > 0 || queueStatus.errors > 0

    return (
        <button
            onClick={() => handleSync(false)}
            disabled={!isOnline || syncing}
            className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 group"
            title={isOnline ? (queueStatus.pending > 0 ? 'Sincronizar pendientes' : 'Conectado') : 'Sin conexión'}
        >
            {syncing ? (
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            ) : justSynced ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
            ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
            )}

            {showBadge && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                    {queueStatus.pending + queueStatus.errors}
                </span>
            )}

            {/* Tooltip on hover */}
            {queueStatus.pending > 0 && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {queueStatus.pending} pendiente{queueStatus.pending !== 1 && 's'}
                </div>
            )}
        </button>
    )
}
