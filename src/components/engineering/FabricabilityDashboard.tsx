'use client'

/**
 * Fabricability Dashboard
 * FASE 2A - Material Control Foundation
 * 
 * Shows an overview of which revisions are ready for fabrication
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    SpoolFabricability,
    analyzeRevisionFabricability,
    getFabricabilitySummary,
    updateAllRevisionStatuses
} from '@/services/fabricability'
import { CheckCircle2, AlertCircle, XCircle, RefreshCw, Loader2, ChevronRight, Archive, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/Typography'

interface FabricabilityDashboardProps {
    projectId: string
}

// Update RevisionDetail to hold the spools lists
interface RevisionDetail {
    id: string
    iso_number: string
    rev_code: string
    revision_status: string
    data_status: string
    material_status: string
    is_fabricable: boolean
    blocking_reason?: string
    fabricable_spools_count: number
    total_spools: number
    fabricable_spools: SpoolFabricability[]
    blocked_spools: SpoolFabricability[]
}

// ... (keep state) ...


export default function FabricabilityDashboard({ projectId }: FabricabilityDashboardProps) {
    const [summary, setSummary] = useState({
        total: 0,
        fabricable: 0,
        blocked_by_data: 0,
        blocked_by_material: 0,
        obsolete: 0
    })
    const [revisions, setRevisions] = useState<RevisionDetail[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [filter, setFilter] = useState<'ALL' | 'FABRICABLE' | 'BLOCKED_DATA' | 'BLOCKED_MATERIAL' | 'OBSOLETE'>('ALL')

    // State for expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setExpandedRows(newSet)
    }

    useEffect(() => {
        loadFabricabilityData()
    }, [projectId])

    async function handleRefresh() {
        setIsRefreshing(true)
        try {
            await updateAllRevisionStatuses(projectId)
            await loadFabricabilityData()
        } catch (error) {
            console.error('Error refreshing statuses:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    async function loadFabricabilityData() {
        setIsLoading(true)
        try {
            const supabase = createClient()

            // 1. Get summary stats
            const summaryData = await getFabricabilitySummary(projectId)
            setSummary(summaryData)

            // 2. Get all revisions with their statuses
            const { data: revisionsData } = await supabase
                .from('engineering_revisions')
                .select(`
                    id,
                    rev_code,
                    revision_status,
                    data_status,
                    material_status,
                    isometrics!inner(iso_number)
                `)
                .eq('project_id', projectId)
                .order('iso_number', { foreignTable: 'isometrics' })

            if (revisionsData) {
                // Calculate fabricability for each
                const details: RevisionDetail[] = []
                for (const rev of revisionsData) {
                    // Use new granular analysis
                    const analysis = await analyzeRevisionFabricability(rev.id)

                    details.push({
                        id: rev.id,
                        iso_number: (rev.isometrics as any).iso_number,
                        rev_code: rev.rev_code,
                        revision_status: rev.revision_status,
                        data_status: rev.data_status,
                        material_status: rev.material_status,
                        is_fabricable: analysis.is_fully_fabricable,
                        blocking_reason: analysis.blocking_reason,
                        fabricable_spools_count: analysis.fabricable_spools_count,
                        total_spools: analysis.total_spools,
                        fabricable_spools: analysis.fabricable_spools,
                        blocked_spools: analysis.blocked_spools
                    })
                }
                setRevisions(details)
            }
        } catch (error) {
            console.error('Error loading fabricability data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Filter revisions
    const filteredRevisions = revisions.filter(rev => {
        switch (filter) {
            case 'FABRICABLE':
                return rev.is_fabricable
            case 'BLOCKED_DATA':
                return !rev.is_fabricable && rev.data_status !== 'COMPLETO'
            case 'BLOCKED_MATERIAL':
                return !rev.is_fabricable && rev.data_status === 'COMPLETO' && rev.material_status !== 'DISPONIBLE'
            case 'OBSOLETE':
                return rev.revision_status !== 'VIGENTE'
            default:
                return true
        }
    })

    const getStatusClasses = (status: string) => {
        const classes: Record<string, string> = {
            'COMPLETO': 'bg-emerald-500/10 text-emerald-400',
            'EN_DESARROLLO': 'bg-amber-500/10 text-amber-400',
            'VACIO': 'bg-rose-500/10 text-rose-400',
            'BLOQUEADO': 'bg-gray-500/10 text-gray-400',
            'DISPONIBLE': 'bg-emerald-500/10 text-emerald-400',
            'NO_REQUERIDO': 'bg-blue-500/10 text-blue-400',
            'PENDIENTE_COMPRA': 'bg-amber-500/10 text-amber-400',
            'EN_TRANSITO': 'bg-violet-500/10 text-violet-400'
        }
        return classes[status] || 'bg-gray-500/10 text-gray-400'
    }

    if (isLoading && !isRefreshing) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <Loader2 size={40} className="text-brand-primary animate-spin mb-4" />
                <p className="text-text-dim">
                    Analizando fabricabilidad...
                </p>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-lg space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-status-success/20 flex items-center justify-center text-status-success border border-status-success/20 shadow-lg shadow-status-success/5">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <Heading title="Fabricabilidad y Control" size="lg" className="mb-1" />
                            <p className="text-text-dim text-sm">
                                Visualización de qué revisiones están listas para fabricación
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-2 min-w-[140px]"
                    >
                        {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {isRefreshing ? 'Analizando...' : 'Refrescar'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-black/20 border border-glass-border/30 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-white mb-1">{summary.total}</span>
                        <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Total Revisiones</span>
                    </div>

                    <div className="bg-status-success/10 border border-status-success/20 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-2xl font-bold text-status-success mb-1 flex items-center gap-2">
                                <CheckCircle2 size={20} /> {summary.fabricable}
                            </span>
                            <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Fabricables</span>
                            <span className="text-[10px] text-text-dim mt-1 bg-black/20 px-2 py-0.5 rounded-full">
                                {summary.total > 0 ? Math.round((summary.fabricable / summary.total) * 100) : 0}% del total
                            </span>
                        </div>
                    </div>

                    <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-status-warning mb-1 flex items-center gap-2">
                            <AlertCircle size={20} /> {summary.blocked_by_data}
                        </span>
                        <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Bloq. Datos</span>
                    </div>

                    <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-status-error mb-1 flex items-center gap-2">
                            <XCircle size={20} /> {summary.blocked_by_material}
                        </span>
                        <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Bloq. Material</span>
                    </div>

                    <div className="bg-black/20 border border-glass-border/30 rounded-xl p-4 flex flex-col items-center justify-center text-center opacity-70">
                        <span className="text-2xl font-bold text-text-dim mb-1 flex items-center gap-2">
                            <Archive size={20} /> {summary.obsolete}
                        </span>
                        <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Obsoletas</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-glass-border/30 pb-1">
                    {[
                        { key: 'ALL', label: '📊 Todas', count: revisions.length },
                        { key: 'FABRICABLE', label: '🟢 Fabricables', count: summary.fabricable },
                        { key: 'BLOCKED_DATA', label: '🟡 Bloq. Datos', count: summary.blocked_by_data },
                        { key: 'BLOCKED_MATERIAL', label: '🔴 Bloq. Material', count: summary.blocked_by_material },
                        { key: 'OBSOLETE', label: '⚫ Obsoletas', count: summary.obsolete }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all relative ${filter === tab.key
                                ? 'text-white bg-white/5 border-b-2 border-brand-primary'
                                : 'text-text-dim hover:text-white hover:bg-white/5 border-b-2 border-transparent'
                                }`}
                        >
                            {tab.label} <span className="opacity-50 text-xs ml-1">({tab.count})</span>
                        </button>
                    ))}
                </div>

                {filteredRevisions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-black/20 border border-glass-border/30 rounded-xl border-dashed">
                        <div className="w-16 h-16 rounded-full bg-bg-surface-2 flex items-center justify-center mb-4 text-3xl shadow-inner grayscale opacity-50">
                            📋
                        </div>
                        <h4 className="text-white font-medium mb-1">No hay revisiones en esta categoría</h4>
                        <p className="text-text-dim text-sm">Cambia el filtro para ver otras revisiones</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-glass-border/30 bg-black/20">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-text-dim text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Isométrico</th>
                                    <th className="px-4 py-3 text-center">Rev</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-center">Datos</th>
                                    <th className="px-4 py-3 text-center">Material</th>
                                    <th className="px-4 py-3 text-center">Spools Listos</th>
                                    <th className="px-4 py-3 text-center">Fabricable</th>
                                    <th className="px-4 py-3">Motivo Bloqueo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border/20 text-sm">
                                {filteredRevisions.map(rev => (
                                    <>
                                        <tr
                                            key={rev.id}
                                            onClick={() => toggleRow(rev.id)}
                                            className={`cursor-pointer transition-colors hover:bg-white/5 ${expandedRows.has(rev.id) ? 'bg-white/5' : ''
                                                }`}
                                        >
                                            <td className="px-4 py-3 font-semibold text-white">
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight
                                                        size={14}
                                                        className={`transition-transform duration-200 ${expandedRows.has(rev.id) ? 'rotate-90 text-brand-primary' : 'text-text-dim'}`}
                                                    />
                                                    {rev.iso_number}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-text-dim">{rev.rev_code}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    variant={rev.revision_status === 'VIGENTE' ? 'success' : 'secondary'}
                                                    className="bg-opacity-10 dark:bg-opacity-20 border-opacity-20"
                                                >
                                                    {rev.revision_status}
                                                </Badge>
                                                {rev.data_status === 'COMPLETO' && (
                                                    <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                                                        SPOOL
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusClasses(rev.data_status)}`}>
                                                    {rev.data_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusClasses(rev.material_status)}`}>
                                                    {rev.material_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1 text-xs font-semibold">
                                                        <span className={rev.fabricable_spools_count === rev.total_spools ? 'text-emerald-400' : 'text-white'}>
                                                            {rev.fabricable_spools_count}
                                                        </span>
                                                        <span className="text-text-dim">/</span>
                                                        <span className="text-text-dim">{rev.total_spools}</span>
                                                    </div>
                                                    {rev.total_spools > 0 && (
                                                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${rev.fabricable_spools_count === rev.total_spools ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${(rev.fabricable_spools_count / rev.total_spools) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {rev.is_fabricable ? (
                                                    <CheckCircle2 size={18} className="text-emerald-400 mx-auto" />
                                                ) : (
                                                    <XCircle size={18} className="text-rose-400 mx-auto" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-dim max-w-[200px] truncate">
                                                {rev.blocking_reason || '-'}
                                            </td>
                                        </tr>
                                        {/* Expanded Detail Row */}
                                        {expandedRows.has(rev.id) && (
                                            <tr className="bg-black/40">
                                                <td colSpan={8} className="p-0">
                                                    <div className="p-6 flex flex-col md:flex-row gap-8 text-sm animate-in fade-in slide-in-from-top-2 duration-200 border-b border-glass-border/20">
                                                        {/* Fabricable List */}
                                                        <div className="flex-1 space-y-3">
                                                            <h5 className="text-emerald-400 font-semibold flex items-center gap-2 pb-2 border-b border-emerald-500/20">
                                                                <CheckCircle2 size={16} /> Listos para Fabricar ({rev.fabricable_spools?.length || 0})
                                                            </h5>
                                                            {(rev.fabricable_spools?.length || 0) > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {rev.fabricable_spools.map(s => (
                                                                        <span key={s.spool_id} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 font-mono text-xs">
                                                                            {s.spool_number}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-text-dim italic text-xs">Ningún spool listo.</p>
                                                            )}
                                                        </div>

                                                        {/* Blocked List */}
                                                        <div className="flex-1 space-y-3">
                                                            <h5 className="text-rose-400 font-semibold flex items-center gap-2 pb-2 border-b border-rose-500/20">
                                                                <XCircle size={16} /> Bloqueados por Material ({rev.blocked_spools?.length || 0})
                                                            </h5>
                                                            {(rev.blocked_spools?.length || 0) > 0 ? (
                                                                <div className="flex flex-col gap-2">
                                                                    {rev.blocked_spools.map(s => (
                                                                        <div key={s.spool_id} className="p-2 bg-rose-500/5 border border-rose-500/10 rounded flex flex-col gap-1">
                                                                            <span className="font-mono font-bold text-rose-400 text-xs">{s.spool_number}</span>
                                                                            <span className="text-rose-300/70 text-[10px]">
                                                                                Falta: {s.missing_items.join(', ')}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-text-dim italic text-xs">No hay spools bloqueados.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
