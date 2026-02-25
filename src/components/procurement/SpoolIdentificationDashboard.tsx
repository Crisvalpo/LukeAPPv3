'use client'

import React, { useState, useEffect } from 'react'
import {
    getSpoolCandidates,
    generateSpoolCandidates,
    approveSpoolCandidate,
    rejectSpoolCandidate,
    type SpoolCandidate
} from '@/services/project-materials'
import { Heading, Text } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
    Package,
    CheckCircle,
    XCircle,
    ChevronRight,
    RefreshCw,
    List,
    AlertCircle,
    Layers
} from 'lucide-react'

interface Props {
    projectId: string
}

export default function SpoolIdentificationDashboard({ projectId }: Props) {
    const [candidates, setCandidates] = useState<SpoolCandidate[]>([])
    const [loading, setLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [filterIso, setFilterIso] = useState('')

    useEffect(() => {
        loadCandidates()
    }, [projectId])

    async function loadCandidates() {
        try {
            setLoading(true)
            const data = await getSpoolCandidates(projectId)
            setCandidates(data)
        } catch (error) {
            console.error('Error loading candidates:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerate(isoNumber: string) {
        try {
            setIsGenerating(true)
            await generateSpoolCandidates(projectId, isoNumber)
            await loadCandidates()
        } catch (error) {
            console.error('Error generating candidates:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    async function handleAction(id: string, action: 'approve' | 'reject') {
        try {
            if (action === 'approve') {
                await approveSpoolCandidate(id)
            } else {
                await rejectSpoolCandidate(id)
            }
            // Update local state instead of full reload for better UX
            setCandidates(prev => prev.map(c =>
                c.id === id ? { ...c, status: action === 'approve' ? 'APPROVED' : 'REJECTED' as any } : c
            ))
        } catch (error) {
            console.error('Error processing candidate:', error)
        }
    }

    const filteredCandidates = candidates.filter(c =>
        filterIso === '' || c.isometric_number.toLowerCase().includes(filterIso.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" />
                <span>Cargando candidatos...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.03] p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
                <div>
                    <Heading level={2} className="text-white flex items-center gap-2">
                        <Layers className="w-6 h-6 text-blue-400" />
                        Identificación de Spools
                    </Heading>
                    <Text className="text-slate-400">
                        Revise y apruebe las agrupaciones automáticas para producción.
                    </Text>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Filtrar por Isométrico..."
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64"
                        value={filterIso}
                        onChange={(e) => setFilterIso(e.target.value)}
                    />
                    <button
                        onClick={() => loadCandidates()}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300"
                        title="Refrescar"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {filteredCandidates.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <Heading level={3} className="text-slate-300">No hay candidatos pendientes</Heading>
                    <Text className="text-slate-500">Suba un MTO manual para generar sugerencias o use el buscador.</Text>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredCandidates.map((candidate) => (
                        <div
                            key={candidate.id}
                            className={`p-5 rounded-2xl border transition-all ${candidate.status === 'APPROVED' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                candidate.status === 'REJECTED' ? 'bg-rose-500/5 border-rose-500/20' :
                                    'bg-white/[0.03] border-white/10 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">ISO</Text>
                                        <Text className="text-blue-400 font-mono font-bold">{candidate.isometric_number}</Text>
                                    </div>
                                    <Heading level={4} className="text-white">
                                        Spool: {candidate.suggested_spool_number}
                                    </Heading>
                                </div>
                                <StatusBadge
                                    status={candidate.status === 'APPROVED' ? 'active' : candidate.status === 'REJECTED' ? 'error' : 'pending'}
                                    label={candidate.status}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <Text className="text-xs text-slate-500 mb-1">Componentes</Text>
                                    <Text className="text-white font-bold flex items-center gap-2">
                                        <List className="w-4 h-4 text-slate-400" />
                                        {candidate.items?.length || 0} Items
                                    </Text>
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <Text className="text-xs text-slate-500 mb-1">Peso Estimado</Text>
                                    <Text className="text-white font-bold flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-slate-400" />
                                        {candidate.total_weight_kg.toFixed(2)} kg
                                    </Text>
                                </div>
                            </div>

                            {candidate.status === 'PENDING' && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAction(candidate.id, 'approve')}
                                        className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-2.5 rounded-xl border border-emerald-500/30 transition-all font-medium flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Aprobar Spool
                                    </button>
                                    <button
                                        onClick={() => handleAction(candidate.id, 'reject')}
                                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2.5 rounded-xl border border-rose-500/20 transition-all"
                                        title="Rechazar"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {candidate.status !== 'PENDING' && (
                                <div className="flex items-center gap-2 text-xs font-medium italic text-slate-500">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Este candidato ya ha sido procesado.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
