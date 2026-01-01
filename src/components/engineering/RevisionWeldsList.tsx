'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        <div className="table-wrapper glass-panel m-4">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-white/5">
                    <tr>
                        <th className="px-4 py-3">Spool</th>
                        <th className="px-4 py-3">Junta</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Dia (")</th>
                        <th className="px-4 py-3">Sch</th>
                        <th className="px-4 py-3 text-right">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {welds.map(weld => (
                        <tr key={weld.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-2 font-medium">{weld.spool_number}</td>
                            <td className="px-4 py-2">{weld.weld_number}</td>
                            <td className="px-4 py-2">{weld.type_weld || '-'}</td>
                            <td className="px-4 py-2">{weld.nps || '-'}</td>
                            <td className="px-4 py-2 text-gray-400">{weld.sch || '-'}</td>
                            <td className="px-4 py-2 text-right">
                                <span className="px-2 py-1 rounded-full bg-white/10 text-xs">
                                    {weld.destination || 'SHOP'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
