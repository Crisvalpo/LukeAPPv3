'use client'

import React, { useState, useEffect } from 'react'
import {
    runAllocationEngine,
    getShortageReport,
    type InventoryReception
} from '@/services/material-inventory'
import { createClient } from '@/lib/supabase/client'
import { Heading, Text } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
    Package,
    Truck,
    AlertTriangle,
    Play,
    Plus,
    History,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react'
import ReceiveMaterialModal from './ReceiveMaterialModal'

interface Props {
    projectId: string
}

export default function MaterialInventoryDashboard({ projectId }: Props) {
    const [receptions, setReceptions] = useState<any[]>([])
    const [shortages, setShortages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isRunningEngine, setIsRunningEngine] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [projectId])

    async function loadData() {
        try {
            setLoading(true)
            const supabase = createClient()

            // Load receptions
            const { data: recData } = await supabase
                .from('inventory_receptions')
                .select(`
                    *,
                    master_catalog(commodity_code, category, component_type),
                    master_dimensions(nps, schedule_rating)
                `)
                .eq('project_id', projectId)
                .order('received_at', { ascending: false })

            setReceptions(recData || [])

            // Load shortages
            const shortageData = await getShortageReport(projectId)
            setShortages(shortageData)

        } catch (error) {
            console.error('Error loading inventory data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleRunEngine() {
        try {
            setIsRunningEngine(true)
            await runAllocationEngine(projectId)
            await loadData()
        } catch (error) {
            console.error('Error running engine:', error)
        } finally {
            setIsRunningEngine(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-slate-500">Cargando inventario...</div>

    return (
        <div className="space-y-8">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Truck className="w-8 h-8 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest text-right">Stock Total</span>
                    </div>
                    <Heading level={2} className="text-white">
                        {receptions.reduce((acc, r) => acc + Number(r.quantity_received), 0)}
                    </Heading>
                    <Text className="text-blue-300/60 text-sm">Ítems recibidos a la fecha</Text>
                </div>

                <div className={`p-6 rounded-3xl backdrop-blur-xl border ${shortages.length > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <div className="flex items-center justify-between mb-4">
                        {shortages.length > 0 ? <AlertTriangle className="w-8 h-8 text-rose-400" /> : <Package className="w-8 h-8 text-emerald-400" />}
                        <span className={`text-xs font-bold uppercase tracking-widest text-right ${shortages.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            Shortages
                        </span>
                    </div>
                    <Heading level={2} className="text-white">{shortages.length}</Heading>
                    <Text className="text-slate-400 text-sm">Materiales con faltantes de stock</Text>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
                    <div>
                        <Heading level={4} className="text-white mb-2">Motor de Compromiso</Heading>
                        <Text className="text-xs text-slate-500">Asigna automáticamente el stock disponible a los spools aprobados.</Text>
                    </div>
                    <button
                        onClick={handleRunEngine}
                        disabled={isRunningEngine}
                        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isRunningEngine ? <History className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        {isRunningEngine ? 'Procesando...' : 'Ejecutar Asignación'}
                    </button>
                </div>
            </div>

            {/* Content Tabs/Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Shortages List (Priority) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <Heading level={3} className="text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                            Faltantes Críticos
                        </Heading>
                    </div>

                    <div className="space-y-3">
                        {shortages.map((s, idx) => (
                            <div key={idx} className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl group hover:border-rose-500/30 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <Text className="text-white font-mono font-bold leading-tight">
                                        {s.commodity_code} <br />
                                        <span className="text-slate-500 text-xs font-normal">NPS: {s.nps}</span>
                                    </Text>
                                    <div className="bg-rose-500/20 px-2 py-1 rounded text-[10px] font-black text-rose-400">
                                        -{s.shortage}
                                    </div>
                                </div>
                                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div
                                        className="bg-rose-500 h-full"
                                        style={{ width: `${(s.total_stock / s.total_demand) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="mt-2 flex justify-between text-[10px] uppercase font-bold tracking-tighter text-slate-500">
                                    <span>Stock: {s.total_stock}</span>
                                    <span>Demanda: {s.total_demand}</span>
                                </div>
                            </div>
                        ))}
                        {shortages.length === 0 && (
                            <div className="py-10 text-center bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-2xl">
                                <Text className="text-emerald-500/60 text-sm">Sin faltantes detectados</Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Receptions */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <Heading level={3} className="text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-400" />
                            Historial de Recepciones
                        </Heading>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10 transition-all font-mono shadow-lg shadow-blue-500/5"
                        >
                            <Plus className="w-4 h-4" />
                            Recibir Material
                        </button>
                    </div>

                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Material / Code</th>
                                    <th className="px-6 py-4">Stock</th>
                                    <th className="px-6 py-4">Ubicación</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4 text-right">Heat #</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {receptions.map((r) => (
                                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group text-sm">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{r.master_catalog?.commodity_code}</span>
                                                <span className="text-slate-500 text-xs">NPS: {r.master_dimensions?.nps} {r.master_dimensions?.schedule_rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-mono font-bold">{r.quantity_available}</span>
                                                <span className="text-slate-600 text-xs">/ {r.quantity_received}</span>
                                                {r.quantity_available < r.quantity_received && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400">{r.location_bin || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500">{new Date(r.received_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs text-slate-400 font-mono">
                                                {r.heat_number || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {receptions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-600 italic">
                                            No hay registros de recepción para este proyecto.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ReceiveMaterialModal
                    projectId={projectId}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => loadData()}
                />
            )}
        </div>
    )
}
