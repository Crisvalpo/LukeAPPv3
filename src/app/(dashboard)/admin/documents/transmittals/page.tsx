'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    Send, ArrowDownCircle, ArrowUpCircle,
    Search, Filter, RefreshCw, FileText,
    ChevronRight, ExternalLink, PackageOpen, Clock
} from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { getTransmittals } from '@/services/document-control'
import { Transmittal } from '@/types/document-control'
import { toast } from 'sonner'
import TransmittalReceptionModal from '@/components/documents/TransmittalReceptionModal'
import DocumentControlHeader from '@/components/documents/DocumentControlHeader'

const StatusConfig: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Borrador', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    SENT: { label: 'Enviado', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    RECEIVED: { label: 'Recibido', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    PENDING_PROCESS: { label: 'Pendiente Procezo', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    PROCESSED: { label: 'Procesado', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
}

export default function TransmittalsPage() {
    const router = useRouter()
    const [projectId, setProjectId] = useState<string | null>(null)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [transmittals, setTransmittals] = useState<Transmittal[]>([])

    // UI State
    const [showReceptionModal, setShowReceptionModal] = useState(false)
    const [search, setSearch] = useState('')
    const [directionFilter, setDirectionFilter] = useState('')

    useEffect(() => {
        loadContext()
    }, [])

    async function loadContext() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }

        const { data: member } = await supabase
            .from('members')
            .select('project_id, company_id')
            .eq('user_id', user.id)
            .not('project_id', 'is', null)
            .limit(1)
            .maybeSingle()

        if (member?.project_id) {
            setProjectId(member.project_id)
            setCompanyId(member.company_id)
        } else {
            setIsLoading(false)
        }
    }

    const loadData = useCallback(async () => {
        if (!projectId) return
        setIsLoading(true)
        const res = await getTransmittals(projectId)
        if (res.success && res.data) {
            setTransmittals(res.data)
        } else {
            toast.error(res.message || 'Error al cargar transmittals')
        }
        setIsLoading(false)
    }, [projectId])

    useEffect(() => {
        if (projectId) loadData()
    }, [projectId, loadData])

    const filteredTransmittals = transmittals.filter(t => {
        const matchesSearch = t.transmittal_code.toLowerCase().includes(search.toLowerCase()) ||
            (t.title && t.title.toLowerCase().includes(search.toLowerCase()))
        const matchesDirection = directionFilter ? t.direction === directionFilter : true
        return matchesSearch && matchesDirection
    })

    if (!projectId && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <FileText className="w-16 h-16 text-slate-500" />
                <Heading level={2}>Sin proyecto seleccionado</Heading>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <DocumentControlHeader
                title="Gestión de Transmittals"
                subtitle="Control de envíos y recepciones formales"
                onRefresh={loadData}
                isLoading={isLoading}
                primaryAction={{
                    label: "Recibir Transmittal",
                    icon: <ArrowDownCircle size={18} />,
                    onClick: () => setShowReceptionModal(true)
                }}
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-[#1e293b]/50 border border-white/5 rounded-2xl p-4">
                <div className="relative flex-1 min-w-[280px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por código o título..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-500" />
                    <select
                        value={directionFilter}
                        onChange={e => setDirectionFilter(e.target.value)}
                        className="bg-[#0f172a] border border-white/10 rounded-xl text-sm text-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                        <option value="">Todas las Direcciones</option>
                        <option value="INCOMING">Entrantes (Recibidos)</option>
                        <option value="OUTGOING">Salientes (Emitidos)</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <RefreshCw className="animate-spin text-blue-400" size={32} />
                        <span className="text-slate-400 text-sm">Cargando transmittals...</span>
                    </div>
                ) : filteredTransmittals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                            <Send size={40} className="text-slate-600" />
                        </div>
                        <Heading level={3} className="text-slate-300">No hay transmittals</Heading>
                        <Text className="text-slate-500 mt-1 max-w-xs">
                            Aún no se han registrado entregas formales en este proyecto.
                        </Text>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs">Código</th>
                                    <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs">Título / Referencia</th>
                                    <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs">Dirección</th>
                                    <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs text-center">Ítems</th>
                                    <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs">Estado</th>
                                    <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs">Fecha</th>
                                    <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-wider text-xs text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filteredTransmittals.map((t) => {
                                    const status = StatusConfig[t.status] || { label: t.status, cls: '' }
                                    const isIncoming = t.direction === 'INCOMING'

                                    return (
                                        <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-blue-400 font-medium">
                                                    {t.transmittal_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{t.title || 'Sin título'}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{t.recipient || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${isIncoming ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                                    {isIncoming ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                                                    {isIncoming ? 'ENTRANTE' : 'SALIENTE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs border border-white/5">
                                                    {t.items_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.cls}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">
                                                {new Date(t.created_at).toLocaleDateString('es-CL')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {t.package_url && isIncoming && t.status === 'PENDING_PROCESS' && (
                                                        <Link
                                                            href={`/admin/documents/transmittals/${t.id}/breakdown`}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-medium transition-all"
                                                        >
                                                            <PackageOpen size={14} />
                                                            Procesar
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href={`/admin/documents/transmittals/${t.id}`}
                                                        className="p-1.5 text-slate-500 hover:text-white transition-colors"
                                                        title="Ver Detalle"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showReceptionModal && companyId && (
                <TransmittalReceptionModal
                    isOpen={showReceptionModal}
                    onClose={() => setShowReceptionModal(false)}
                    projectId={projectId!}
                    companyId={companyId}
                    onSuccess={loadData}
                />
            )}
        </div>
    )
}
