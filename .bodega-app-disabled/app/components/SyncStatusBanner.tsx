'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { getOfflineQueueStatus } from '@/services/reception'
import { getLastSyncTime, formatTimeElapsed } from '@/lib/user-context'

interface SyncStatusBannerProps {
    onSyncClick?: () => void
}

export default function SyncStatusBanner({ onSyncClick }: SyncStatusBannerProps) {
    const [lastSync, setLastSync] = useState<number | null>(null)
    const [queueStatus, setQueueStatus] = useState({ pending: 0, errors: 0 })
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        updateStatus()
        const interval = setInterval(updateStatus, 30000) // Update every 30s
        return () => clearInterval(interval)
    }, [])

    const updateStatus = () => {
        const syncTime = getLastSyncTime()
        setLastSync(syncTime)

        const queue = getOfflineQueueStatus()
        setQueueStatus(queue)

        // Show banner if there are pending items OR no recent sync
        const shouldShow = queue.pending > 0 || queue.errors > 0 ||
            !syncTime ||
            (Date.now() - syncTime) > (1000 * 60 * 60) // 1 hour

        setShowBanner(shouldShow)
    }

    if (!showBanner) return null

    const hasPending = queueStatus.pending > 0
    const hasErrors = queueStatus.errors > 0
    const isStale = lastSync && (Date.now() - lastSync) > (1000 * 60 * 60 * 2) // 2 hours

    // Different messages based on state
    const getMessage = () => {
        if (hasErrors) {
            return {
                icon: <AlertCircle className="w-5 h-5 text-red-400" />,
                title: 'Error en sincronización',
                message: `${queueStatus.errors} ${queueStatus.errors === 1 ? 'registro requiere' : 'registros requieren'} tu atención`,
                color: 'from-red-600 to-red-700'
            }
        }

        if (hasPending) {
            return {
                icon: <TrendingUp className="w-5 h-5 text-orange-400" />,
                title: 'Cambios pendientes',
                message: `${queueStatus.pending} ${queueStatus.pending === 1 ? 'recepción esperando' : 'recepciones esperando'} sincronizar`,
                color: 'from-orange-600 to-orange-700'
            }
        }

        if (isStale) {
            return {
                icon: <Clock className="w-5 h-5 text-blue-400" />,
                title: '¿Todo listo por hoy?',
                message: lastSync ? `Última sincronización: ${formatTimeElapsed(lastSync)}` : 'No hay sincronización reciente',
                color: 'from-blue-600 to-blue-700'
            }
        }

        return {
            icon: <CheckCircle className="w-5 h-5 text-green-400" />,
            title: 'Busca señal y sincroniza',
            message: 'Mantén tus datos actualizados',
            color: 'from-green-600 to-green-700'
        }
    }

    const { icon, title, message, color } = getMessage()

    return (
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div
                onClick={onSyncClick}
                className={`bg-gradient-to-r ${color} rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity`}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm mb-1">
                            {title}
                        </h3>
                        <p className="text-xs text-white/80 mb-2">
                            {message}
                        </p>
                        {lastSync && !hasErrors && (
                            <p className="text-xs text-white/60">
                                {formatTimeElapsed(lastSync)}
                            </p>
                        )}
                    </div>
                    {hasPending && (
                        <div className="flex-shrink-0 bg-white/20 rounded-full px-3 py-1">
                            <span className="text-white font-bold text-sm">
                                {queueStatus.pending}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
