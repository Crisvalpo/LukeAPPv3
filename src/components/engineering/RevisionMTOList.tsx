'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package } from 'lucide-react'

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
        <div className="p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4 px-2">
                <h5 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-wider">
                    <span className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
                        <Package size={16} />
                    </span>
                    Lista de Materiales (BMI)
                </h5>
                <span className="text-xs font-medium text-text-dim bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    Total: {items.length} items
                </span>
            </div>

            <div className="bg-bg-surface-1 border border-glass-border rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-glass-border">
                            <tr>
                                <th className="px-5 py-3">Spool</th>
                                <th className="px-5 py-3">Código Item</th>
                                <th className="px-5 py-3">Clase</th>
                                <th className="px-5 py-3 text-right">Cant.</th>
                                <th className="px-5 py-3">Unid.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/30">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3 font-medium text-text-muted">{item.spool_number}</td>
                                    <td className="px-5 py-3 font-mono text-purple-300">{item.item_code}</td>
                                    <td className="px-5 py-3 text-text-muted">{item.piping_class || '-'}</td>
                                    <td className="px-5 py-3 text-right font-mono font-bold text-white">{item.qty}</td>
                                    <td className="px-5 py-3 text-text-dim text-xs uppercase">{item.qty_unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
