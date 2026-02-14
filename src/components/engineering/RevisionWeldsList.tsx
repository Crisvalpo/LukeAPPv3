'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flame } from 'lucide-react'

interface Weld {
    id: string
    weld_number: string
    spool_number: string
    nps: string | null
    type_weld: string | null
    sch: string | null
    destination: string | null
}

interface Props {
    revisionId: string
    projectId: string
}

export default function RevisionWeldsList({ revisionId }: Props) {
    const [welds, setWelds] = useState<Weld[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadWelds() {
            setIsLoading(true)
            const supabase = createClient()

            const { data, error } = await supabase
                .from('spools_welds')
                .select('id, weld_number, spool_number, nps, type_weld, sch, destination')
                .eq('revision_id', revisionId)
                .order('spool_number', { ascending: true })
                .order('weld_number', { ascending: true })

            if (!error && data) {
                setWelds(data)
            }
            setIsLoading(false)
        }

        loadWelds()
    }, [revisionId])

    if (isLoading) return <div className="p-4 text-center text-gray-400">Cargando uniones...</div>
    if (welds.length === 0) return <div className="p-4 text-center text-gray-500">No hay uniones registradas.</div>

    return (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4 px-2">
                <h5 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-wider">
                    <span className="p-1.5 rounded-md bg-orange-500/20 text-orange-400">
                        <Flame size={16} />
                    </span>
                    Lista de Uniones
                </h5>
                <span className="text-xs font-medium text-text-dim bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    Total: {welds.length} uniones
                </span>
            </div>

            <div className="bg-bg-surface-1 border border-glass-border rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-glass-border">
                            <tr>
                                <th className="px-5 py-3">Spool</th>
                                <th className="px-5 py-3">Junta</th>
                                <th className="px-5 py-3">Tipo</th>
                                <th className="px-5 py-3">Dia (")</th>
                                <th className="px-5 py-3">Sch</th>
                                <th className="px-5 py-3 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/30">
                            {welds.map(weld => (
                                <tr key={weld.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3 font-medium text-white">{weld.spool_number}</td>
                                    <td className="px-5 py-3 font-mono text-orange-200">{weld.weld_number}</td>
                                    <td className="px-5 py-3 text-text-muted">{weld.type_weld || '-'}</td>
                                    <td className="px-5 py-3 text-text-muted">{weld.nps || '-'}</td>
                                    <td className="px-5 py-3 text-text-dim">{weld.sch || '-'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${weld.destination === 'FIELD'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {weld.destination || 'SHOP'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
