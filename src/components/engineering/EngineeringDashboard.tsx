'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { updateSpoolingStatus } from '@/services/document-control'
import { formatDate } from '@/lib/utils'
import {
    SpoolingStatus,
    SpoolingStatusType,
    getCombinedStatusLabel,
    SpoolingStatusLabels
} from '@/constants/isometric-status'
import { toast } from 'sonner'


// Reusing the IsometricRow interface from admin/documents/page.tsx
// Ideally this should be in a shared types file
interface IsometricRow {
    id: string
    document_id: string
    iso_number: string
    revision: string
    title: string
    revision_status: any
    spooling_status: SpoolingStatusType
    combined_status: string
    spooling_date: string | null
    delivery_date: string | null
    delivery_transmittal: string | null
    file_url: string | null
}

interface EngineeringDashboardProps {
    isometrics: IsometricRow[]
    projectId: string
    userId: string
}

export default function EngineeringDashboard({ isometrics: initialIsometrics, projectId, userId }: EngineeringDashboardProps) {
    const router = useRouter()
    const [isometrics, setIsometrics] = useState<IsometricRow[]>(initialIsometrics)
    const [searchTerm, setSearchTerm] = useState('')
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

    // Actions
    const handleToggleSpooling = async (iso: IsometricRow) => {
        if (updatingIds.has(iso.id)) return

        // Only allow toggling between SIN_SPOOLEAR and SPOOLEADO for now, or EN_PROCESO
        // User request: "Marcar como Spooleado"
        // Logic: If not SPOOLEADO, make it SPOOLEADO. If already SPOOLEADO, maybe revert?

        const newStatus: SpoolingStatusType = iso.spooling_status === SpoolingStatus.SPOOLEADO
            ? SpoolingStatus.SIN_SPOOLEAR
            : SpoolingStatus.SPOOLEADO

        try {
            setUpdatingIds(prev => new Set(prev).add(iso.id))
            const res = await updateSpoolingStatus(iso.id, newStatus, userId)

            if (res.success) {
                setIsometrics(prev => prev.map(item =>
                    item.id === iso.id
                        ? { ...item, spooling_status: newStatus, spooling_date: newStatus === 'SPOOLEADO' ? new Date().toISOString() : null }
                        : item
                ))
                toast.success(`Estado actualizado a ${SpoolingStatusLabels[newStatus]}`)
            } else {
                toast.error(res.message || 'Error al actualizar estado')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error de conexión')
        } finally {
            setUpdatingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(iso.id)
                return newSet
            })
            router.refresh()
        }
    }

    // Filter
    const filteredIsos = isometrics.filter(iso =>
        iso.iso_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iso.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getSpoolingStatusBadge = (status: SpoolingStatusType) => {
        switch (status) {
            case SpoolingStatus.SPOOLEADO:
            case SpoolingStatus.SPOOLEADO_MANUAL:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle size={12} /> Spooleado</span>
            case SpoolingStatus.EN_PROCESO:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Clock size={12} /> En Proceso</span>
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20"><AlertTriangle size={12} /> Pendiente</span>
        }
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Heading level={1} className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                        Ingeniería
                    </Heading>
                    <Text className="text-slate-400 text-sm mt-1">
                        Control de Spooling y Verificación de Isométricos
                    </Text>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-[#1e293b]/50 border border-white/5 rounded-xl p-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por número de isométrico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    />
                </div>
                {/* Stats */}
                <div className="flex gap-4 px-4 border-l border-white/10">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
                        <span className="text-sm font-bold text-white">{isometrics.length}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Spooleados</span>
                        <span className="text-sm font-bold text-emerald-400">
                            {isometrics.filter(i => i.spooling_status === SpoolingStatus.SPOOLEADO || i.spooling_status === SpoolingStatus.SPOOLEADO_MANUAL).length}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Pendientes</span>
                        <span className="text-sm font-bold text-orange-400">
                            {isometrics.filter(i => i.spooling_status !== SpoolingStatus.SPOOLEADO && i.spooling_status !== SpoolingStatus.SPOOLEADO_MANUAL).length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-white/5 text-slate-200 font-medium border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4">Isométrico</th>
                                <th className="px-6 py-4">Revisión</th>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Estado Spooling</th>
                                <th className="px-6 py-4">Fecha Spooling</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredIsos.map((iso) => (
                                <tr key={iso.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-white">
                                        {iso.iso_number}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 bg-slate-800 rounded text-xs border border-white/5">{iso.revision}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[200px] truncate" title={iso.title}>{iso.title}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getSpoolingStatusBadge(iso.spooling_status)}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {iso.spooling_date ? formatDate(iso.spooling_date) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggleSpooling(iso)}
                                            disabled={updatingIds.has(iso.id)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                                ${iso.spooling_status === SpoolingStatus.SPOOLEADO
                                                    ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                }
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                            `}
                                        >
                                            {updatingIds.has(iso.id) ? 'Guardando...' :
                                                iso.spooling_status === SpoolingStatus.SPOOLEADO ? 'Desmarcar' : 'Marcar Spooleado'
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredIsos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron isométricos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
