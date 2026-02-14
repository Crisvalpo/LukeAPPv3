'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag } from 'lucide-react'

interface SpoolWithTag {
    id: string
    spool_number: string
    management_tag: string | null
    status: string
    total_welds: number
    current_location_id: string | null
    location: {
        name: string
        code: string
    } | null
}

interface Props {
    revisionId: string
    projectId: string
}

export default function RevisionSpoolsList({ revisionId, projectId }: Props) {
    const [spools, setSpools] = useState<SpoolWithTag[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadSpools() {
            setIsLoading(true)
            const supabase = createClient()

            const { data, error } = await supabase
                .from('spools')
                .select(`
                    id,
                    spool_number,
                    management_tag,
                    status,
                    total_welds,
                    current_location_id,
                    location:current_location_id (name, code)
                `)
                .eq('revision_id', revisionId)
                .order('spool_number', { ascending: true })

            if (!error && data) {
                const loadedSpools = data.map((item: any) => ({
                    id: item.id,
                    spool_number: item.spool_number,
                    management_tag: item.management_tag,
                    status: item.status,
                    total_welds: item.total_welds,
                    current_location_id: item.current_location_id,
                    location: item.location
                }))
                setSpools(loadedSpools)
            } else if (error) {
                console.error('Error fetching spools:', error)
            }
            setIsLoading(false)
        }

        loadSpools()
    }, [revisionId])

    if (isLoading) {
        return <div className="p-12 text-center text-text-muted flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
            Cargando spools...
        </div>
    }

    if (spools.length === 0) {
        return <div className="p-12 text-center text-text-dim italic">No hay spools generados para esta revisión.</div>
    }

    return (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4 px-2">
                <h5 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-wider">
                    <span className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
                        <Tag size={16} />
                    </span>
                    Spools y Tags de Gestión
                </h5>
                <span className="text-xs font-medium text-text-dim bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    Total: {spools.length} spools
                </span>
            </div>

            <div className="bg-bg-surface-1 border border-glass-border rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-glass-border">
                            <tr>
                                <th className="px-5 py-3 w-[140px]">Tag Gestión</th>
                                <th className="px-5 py-3">Spool Number</th>
                                <th className="px-5 py-3">Ubicación</th>
                                <th className="px-5 py-3 text-center">Uniones</th>
                                <th className="px-5 py-3 text-right">Estado Actual</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/30">
                            {spools.map(spool => (
                                <tr key={spool.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${spool.management_tag
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:border-purple-500/40'
                                            : 'text-text-dim'
                                            }`}>
                                            {spool.management_tag || '---'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 font-medium text-white group-hover:text-brand-primary transition-colors">
                                        {spool.spool_number}
                                    </td>
                                    <td className="px-5 py-3">
                                        {spool.location ? (
                                            <div className="flex items-center gap-2 text-text-muted">
                                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white border border-white/10">
                                                    {spool.location.code}
                                                </span>
                                                <span className="truncate max-w-[200px]" title={spool.location.name}>
                                                    {spool.location.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-text-dim italic text-xs pl-2">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-center font-mono text-text-muted">
                                        {spool.total_welds}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <StatusBadge status={spool.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-3 text-center text-xs text-text-dim">
                * Los tags de gestión son asignados automáticamente al cargar la revisión.
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const config = getStatusConfig(status)

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm transition-transform hover:scale-105"
            style={{
                backgroundColor: config.bg,
                color: config.text,
                borderColor: config.border
            }}
        >
            <span className="text-[10px]">{config.icon}</span>
            {status.replace(/_/g, ' ')}
        </span>
    )
}

function getStatusConfig(status: string) {
    // Adapted colors for Dark Mode
    const map: Record<string, any> = {
        'PENDING': { bg: 'rgba(234, 179, 8, 0.15)', text: '#fef08a', border: 'rgba(234, 179, 8, 0.3)', icon: '⏳' },
        'IN_FABRICATION': { bg: 'rgba(59, 130, 246, 0.15)', text: '#bfdbfe', border: 'rgba(59, 130, 246, 0.3)', icon: '🔨' },
        'COMPLETED': { bg: 'rgba(16, 185, 129, 0.15)', text: '#a7f3d0', border: 'rgba(16, 185, 129, 0.3)', icon: '✅' },
        'PAINTING': { bg: 'rgba(236, 72, 153, 0.15)', text: '#fbcfe8', border: 'rgba(236, 72, 153, 0.3)', icon: '🎨' },
        'SHIPPED': { bg: 'rgba(99, 102, 241, 0.15)', text: '#c7d2fe', border: 'rgba(99, 102, 241, 0.3)', icon: '🚚' },
        'INSTALLED': { bg: 'rgba(148, 163, 184, 0.15)', text: '#e2e8f0', border: 'rgba(148, 163, 184, 0.3)', icon: '🏗️' },
        'DELIVERED': { bg: 'rgba(6, 182, 212, 0.15)', text: '#a5f3fc', border: 'rgba(6, 182, 212, 0.3)', icon: '📦' }
    }
    return map[status] || { bg: 'rgba(255,255,255,0.05)', text: '#94a3b8', border: 'themes', icon: '❓' }
}
