'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Package, Hash, Layers, List } from 'lucide-react'
import { Text } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { MTOItemSummary } from '@/services/material-consolidation'

interface Props {
    isoNumber: string
    spools: {
        spool_id: string
        spool_name: string
        spool_tag?: string
        items: MTOItemSummary[]
    }[]
    stats: {
        total_spools: number
        total_items: number
        total_quantity: number
    }
    selectedItems: MTOItemSummary[]
    onToggleItem: (item: MTOItemSummary) => void
    onToggleSpool: (items: MTOItemSummary[]) => void
}

export default function IsometricMTOCard({
    isoNumber,
    spools,
    stats,
    selectedItems,
    onToggleItem,
    onToggleSpool
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Calculate Isometric Status
    const totalRequested = spools.reduce((acc, spool) =>
        acc + spool.items.reduce((sAcc, item) => sAcc + (item.quantity_requested || 0), 0), 0)
    const totalReceived = spools.reduce((acc, spool) =>
        acc + spool.items.reduce((sAcc, item) => sAcc + (item.quantity_received || 0), 0), 0)

    let isoStatus: 'pending' | 'active' | 'completed' = 'pending'
    let isoLabel = 'Pendiente'

    if (stats.total_quantity > 0) {
        if (totalReceived >= stats.total_quantity) {
            isoStatus = 'active'
            isoLabel = 'Completo'
        } else if (totalRequested >= stats.total_quantity) {
            isoStatus = 'active'
            isoLabel = 'Solicitado'
        } else if (totalRequested > 0) {
            isoStatus = 'pending'
            isoLabel = 'Parcial'
        }
    }

    return (
        <div className={`mb-4 border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded
            ? 'bg-white/5 border-white/20 shadow-2xl shadow-indigo-500/10'
            : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
            }`}>
            {/* Header */}
            <div
                className="p-4 flex justify-between items-center cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-white/5 text-indigo-400 group-hover:bg-indigo-500/20'
                        }`}>
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white tracking-tight">{isoNumber}</h3>
                            <StatusBadge status={isoStatus as any} label={isoLabel} />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-white/30 text-xs font-semibold uppercase tracking-wider">
                                <Layers size={12} className="text-indigo-400/50" />
                                {stats.total_spools} Spools
                            </div>
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            <div className="flex items-center gap-1.5 text-white/30 text-xs font-semibold uppercase tracking-wider">
                                <List size={12} className="text-indigo-400/50" />
                                {stats.total_items} Items
                            </div>
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-md text-[10px] font-bold border border-indigo-500/20">
                                {stats.total_quantity} TOTAL
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-white/10 text-white' : 'text-white/20 group-hover:text-white/40'
                    }`}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {spools.map(spool => {
                        const allSpoolItemsSelected = spool.items.every(i => selectedItems.find(s => s.id === i.id))
                        return (
                            <div key={spool.spool_id} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-3 bg-white/5 flex justify-between items-center border-b border-white/5">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/40 focus:ring-offset-0 transition-all cursor-pointer"
                                                checked={allSpoolItemsSelected}
                                                onChange={() => onToggleSpool(spool.items)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-indigo-300 uppercase tracking-wide">
                                                {spool.spool_name}
                                            </span>
                                            {spool.spool_tag && (
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded text-[10px] font-mono font-bold">
                                                    {spool.spool_tag}
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                    <Text size="xs" className="text-white/20 font-bold uppercase tracking-widest">
                                        {spool.items.length} Items
                                    </Text>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/[0.02] text-[10px] text-white/40 uppercase tracking-widest font-black">
                                                <th className="px-4 py-2 w-10"></th>
                                                <th className="px-4 py-2">Item Code</th>
                                                <th className="px-4 py-2">Descripción</th>
                                                <th className="px-4 py-2 text-center bg-indigo-500/5">Inputs</th>
                                                <th className="px-4 py-2 text-right">Req.</th>
                                                <th className="px-4 py-2 text-right">Sol.</th>
                                                <th className="px-4 py-2 text-right">Recep.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {spool.items.map(item => {
                                                const isSelected = !!selectedItems.find(i => i.id === item.id)
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className={`transition-colors group/row ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/40 transition-all cursor-pointer"
                                                                checked={isSelected}
                                                                onChange={() => onToggleItem(item)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-mono font-bold text-white group-hover/row:text-indigo-300 transition-colors">
                                                                    {item.item_code}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-[11px] text-white/60 line-clamp-1 group-hover/row:text-white transition-colors" title={item.description}>
                                                                {item.description}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center gap-1">
                                                                {[item.input1, item.input2, item.input3, item.input4].filter(Boolean).map((inp, idx) => (
                                                                    <span key={idx} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white/40">
                                                                        {inp}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs font-mono font-bold text-white">
                                                                    {item.quantity_required}
                                                                </span>
                                                                <span className="text-[9px] text-white/20 font-bold tracking-tighter uppercase">
                                                                    {item.unit || 'UN'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`text-xs font-mono font-bold ${item.quantity_requested > 0 ? 'text-amber-400' : 'text-white/10'}`}>
                                                                {item.quantity_requested}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`text-xs font-mono font-bold ${item.quantity_received > 0 ? 'text-emerald-400' : 'text-white/10'}`}>
                                                                {item.quantity_received}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
