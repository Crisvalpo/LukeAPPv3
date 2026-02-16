'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, ClipboardList, Package, ExternalLink, Calendar, Clock, Truck } from 'lucide-react'
import { getMaterialRequests } from '@/services/material-requests'
import MaterialRequestDetailsModal from './MaterialRequestDetailsModal'
import { Heading, Text } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { MaterialRequest } from '@/types'

interface MaterialRequestListProps {
    projectId: string
}

export default function MaterialRequestList({ projectId }: MaterialRequestListProps) {
    const router = useRouter()
    const [requests, setRequests] = useState<MaterialRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'CLIENT_MIR' | 'CONTRACTOR_PO'>('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')

    useEffect(() => {
        if (projectId) {
            loadRequests()
        }
    }, [projectId])

    async function loadRequests() {
        setIsLoading(true)
        try {
            const data = await getMaterialRequests(projectId)
            setRequests(data)
        } catch (err) {
            console.error(err)
            setError('Error al cargar solicitudes')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter logic
    const filteredRequests = requests.filter(req => {
        const matchesSearch = (req.request_number || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = typeFilter === 'ALL' || req.request_type === typeFilter
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
    })

    const getStatusType = (status: string): any => {
        const map: Record<string, string> = {
            'DRAFT': 'pending',
            'SENT': 'active',
            'APPROVED': 'active',
            'REJECTED': 'cancelled',
            'PARTIAL': 'pending',
            'COMPLETED': 'active'
        }
        return map[status] || 'pending'
    }

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            'DRAFT': 'Borrador',
            'SENT': 'Enviada',
            'APPROVED': 'Aprobada',
            'REJECTED': 'Rechazada',
            'PARTIAL': 'Parcial',
            'COMPLETED': 'Completada'
        }
        return map[status] || status
    }

    if (error) return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <Text className="text-red-400">{error}</Text>
        </div>
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar MIR o PO..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="ALL">Todos los Tipos</option>
                            <option value="CLIENT_MIR">MIR Cliente</option>
                            <option value="CONTRACTOR_PO">PO Compra</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="ALL">Todos los Estados</option>
                            <option value="DRAFT">Borrador</option>
                            <option value="SENT">Enviada</option>
                            <option value="APPROVED">Aprobada</option>
                            <option value="COMPLETED">Completada</option>
                        </select>
                    </div>
                </div>

                <div className="hidden md:block">
                    <Text size="xs" className="text-white/20 uppercase tracking-widest font-black">
                        Procurement Pipeline
                    </Text>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-white/40 uppercase text-[10px] tracking-[0.2em] font-bold">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">N° Solicitud</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Fechas</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            <Text className="text-white/30">Cargando solicitudes...</Text>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-white/5 rounded-full text-white/20">
                                                <ClipboardList size={48} />
                                            </div>
                                            <Text className="text-white/30">No se encontraron solicitudes.</Text>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr
                                        key={req.id}
                                        onClick={() => setSelectedRequest(req)}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={getStatusType(req.status)}
                                                label={getStatusLabel(req.status)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <Text className="text-white font-mono font-bold group-hover:text-indigo-400 transition-colors">
                                                    {req.request_number}
                                                </Text>
                                                <Text size="xs" className="text-white/20">
                                                    ID: {req.id.split('-')[0]}
                                                </Text>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold border ${req.request_type === 'CLIENT_MIR'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {req.request_type === 'CLIENT_MIR' ? <Package size={14} /> : <Truck size={14} />}
                                                {req.request_type === 'CLIENT_MIR' ? 'MIR CLIENTE' : 'PO COMPRA'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-white/50 text-xs">
                                                    <Calendar size={12} />
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </div>
                                                {req.eta_date && (
                                                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
                                                        <Clock size={12} />
                                                        ETA: {new Date(req.eta_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="p-2 bg-white/5 text-white/30 hover:bg-white/10 hover:text-white rounded-xl transition-all inline-flex items-center gap-2 text-xs font-bold"
                                            >
                                                Ver Detalle
                                                <ExternalLink size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Signature */}
                <div className="p-4 bg-white/5 border-t border-white/10 text-center">
                    <Text size="xs" className="text-white/5 uppercase tracking-[0.3em] font-black">
                        LukeAPP Material Tracking Engine • V3.0
                    </Text>
                </div>
            </div>

            {selectedRequest && (
                <MaterialRequestDetailsModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdate={() => {
                        loadRequests()
                        setSelectedRequest(null)
                    }}
                />
            )}
        </div>
    )
}
