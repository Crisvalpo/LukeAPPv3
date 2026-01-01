'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MTOItem {
    id: string
    spool_number: string
    item_code: string
    qty: number
    qty_unit: string
    piping_class: string | null
}

interface Props {
    revisionId: string
    projectId: string
}

export default function RevisionMTOList({ revisionId }: Props) {
    const [items, setItems] = useState<MTOItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadMTO() {
            setIsLoading(true)
            const supabase = createClient()

            // Note: Actual columns depend on your schema. 
            // Assuming standard columns + we join spools to get spool_number if needed, 
            // or if spools_mto has spool_number directly.
            // Checking assumption: spools_mto usually links to spool_id.
            // But we want to list by spool.

            const { data, error } = await supabase
                .from('spools_mto')
                .select('id, spool_number, item_code, qty, qty_unit, piping_class')
                .eq('revision_id', revisionId)
                .order('spool_number', { ascending: true })
                .order('item_code', { ascending: true })

            if (!error && data) {
                setItems(data as MTOItem[])
            }
            setIsLoading(false)
        }

        loadMTO()
    }, [revisionId])

    if (isLoading) return <div className="p-4 text-center text-gray-400">Cargando materiales...</div>
    if (items.length === 0) return <div className="p-4 text-center text-gray-500">No hay materiales registrados.</div>

    return (
        <div className="table-wrapper glass-panel m-4">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-white/5">
                    <tr>
                        <th className="px-4 py-3">Spool</th>
                        <th className="px-4 py-3">Código Item</th>
                        <th className="px-4 py-3">Clase</th>
                        <th className="px-4 py-3 text-right">Cant.</th>
                        <th className="px-4 py-3">Unid.</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-2 font-medium text-gray-400">{item.spool_number}</td>
                            <td className="px-4 py-2 font-mono text-purple-300">{item.item_code}</td>
                            <td className="px-4 py-2 text-gray-400">{item.piping_class || '-'}</td>
                            <td className="px-4 py-2 text-right font-mono">{item.qty}</td>
                            <td className="px-4 py-2 text-gray-400 text-xs">{item.qty_unit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
