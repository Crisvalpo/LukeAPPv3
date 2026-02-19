'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ChevronLeft, FileText, Download, PackageOpen,
    Calendar, User, Send, CheckCircle2, AlertCircle,
    ArrowDownCircle, ArrowUpCircle, ExternalLink
} from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { getTransmittal } from '@/services/document-control'
import { Transmittal, TransmittalStatus, TransmittalDirection } from '@/types/document-control'
import { toast } from 'sonner'

const StatusConfig: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Borrador', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    SENT: { label: 'Enviado', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    RECEIVED: { label: 'Recibido', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    PENDING_PROCESS: { label: 'Pendiente Procezo', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    PROCESSED: { label: 'Procesado', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
}

export default function TransmittalDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [transmittal, setTransmittal] = useState<Transmittal | null>(null)

    const loadData = useCallback(async () => {
        if (!id) return
        setIsLoading(true)
        const res = await getTransmittal(id as string)
        if (res.success && res.data) {
            setTransmittal(res.data)
        } else {
            toast.error(res.message || 'Error al cargar detalle del transmittal')
        }
        setIsLoading(false)
    }, [id])

    useEffect(() => {
        loadData()
    }, [loadData])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
            </div>
        )
    }

    if (!transmittal) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <Heading level={2}>Transmittal no encontrado</Heading>
                <Link href="/admin/documents/transmittals" className="text-blue-400 hover:underline">Volver al listado</Link>
            </div>
        )
    }

    const statusObj = StatusConfig[transmittal.status] || { label: transmittal.status, cls: '' }
    const isIncoming = transmittal.direction === 'INCOMING'

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href="/admin/documents/transmittals"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-2"
                    >
                        <ChevronLeft size={16} />
                        Volver a Transmittals
                    </Link>
                    <div className="flex items-center gap-3">
                        <Heading level={1} className="text-2xl md:text-3xl font-bold text-white">
                            {transmittal.transmittal_code}
                        </Heading>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusObj.cls}`}>
                            {statusObj.label}
                        </span>
                    </div>
                    <Text className="text-slate-400">{transmittal.title || 'Sin Título'}</Text>
                </div>

                <div className="flex gap-2">
                    {isIncoming && transmittal.package_url && transmittal.status === 'PENDING_PROCESS' && (
                        <button
                            onClick={() => router.push(`/admin/documents/transmittals/${id}/breakdown`)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        >
                            <PackageOpen size={18} />
                            Desglosar Paquete
                        </button>
                    )}
                    {transmittal.package_url && (
                        <a
                            href={transmittal.package_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all"
                        >
                            <Download size={18} className="text-blue-400" />
                            Descargar ZIP
                        </a>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* General Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-2 text-slate-400 mb-4 border-b border-white/5 pb-2">
                            <FileText size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Detalles Generales</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Dirección</label>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    {isIncoming ? <ArrowDownCircle size={18} className="text-blue-400" /> : <ArrowUpCircle size={18} className="text-indigo-400" />}
                                    {isIncoming ? 'Recibido (Entrante)' : 'Emitido (Saliente)'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{isIncoming ? 'Remitente' : 'Destinatario'}</label>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <User size={18} className="text-slate-400" />
                                    {transmittal.recipient || 'N/A'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Fecha Registro</label>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <Calendar size={18} className="text-slate-400" />
                                    {new Date(transmittal.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ítems Incluidos</label>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <div className="bg-slate-800 px-2 py-0.5 rounded text-sm">{transmittal.items_count}</div>
                                    <span className="text-xs text-slate-500">Documentos registrados</span>
                                </div>
                            </div>
                        </div>
                        {transmittal.notes && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">Notas / Comentarios</label>
                                <div className="text-sm text-slate-300 bg-black/20 p-4 rounded-xl border border-white/5">
                                    {transmittal.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-400" />
                                <Heading level={3} className="text-lg font-bold text-white">Documentos Asociados</Heading>
                            </div>
                        </div>
                        {transmittal.items && transmittal.items.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#0f172a]/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Código Rev</th>
                                        <th className="px-6 py-4">Documento</th>
                                        <th className="px-6 py-4">Propósito</th>
                                        <th className="px-6 py-4 text-right">Ver</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {transmittal.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                    {item.document_revision?.rev_code || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.document_revision ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-medium line-clamp-1">{item.document_revision.file_name || 'Sin nombre de archivo'}</span>
                                                        <span className="text-[10px] text-slate-500 mt-0.5">Hash: {item.document_revision.file_hash?.substring(0, 12) || '—'}...</span>
                                                    </div>
                                                ) : <span className="text-slate-500">Documento no vinculado</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-400 text-xs">{item.purpose}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {item.document_revision?.document_id && (
                                                    <Link
                                                        href={`/admin/documents/${item.document_revision.document_id}`}
                                                        className="text-slate-500 hover:text-white transition-colors"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-12 text-center">
                                <Text className="text-slate-500">No hay documentos registrados directamente en este transmittal.</Text>
                                {isIncoming && (
                                    <Text className="text-xs text-slate-600 mt-2">Debes procesar el paquete recibido para desglosar su contenido.</Text>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Files/Actions */}
                <div className="space-y-6">
                    <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl sticky top-8">
                        <div className="flex items-center gap-2 text-slate-400 mb-4 border-b border-white/5 pb-2">
                            <PackageOpen size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Archivos del Paquete</span>
                        </div>

                        <div className="space-y-4">
                            {transmittal.package_url ? (
                                <div className="p-4 bg-[#0f172a] rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Download size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Text className="text-xs font-bold text-white uppercase tracking-tight">Paquete ZIP</Text>
                                            <Text className="text-[10px] text-slate-500 truncate">{transmittal.package_url.split('/').pop()}</Text>
                                            <a
                                                href={transmittal.package_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-2 text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                                            >
                                                DESCARGAR AHORA
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                                    <Text className="text-xs text-slate-500 font-medium">Sin archivo de paquete</Text>
                                </div>
                            )}

                            {transmittal.manifest_url && (
                                <div className="p-4 bg-[#0f172a] rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Text className="text-xs font-bold text-white uppercase tracking-tight">Manifiesto Excel</Text>
                                            <Text className="text-[10px] text-slate-500 truncate">{transmittal.manifest_url.split('/').pop()}</Text>
                                            <a
                                                href={transmittal.manifest_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                                            >
                                                VER CONTROL
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Special Actions for Piping */}
                        {isIncoming && transmittal.status === 'PENDING_PROCESS' && (
                            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20">
                                    <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-1.5">
                                        <AlertCircle size={14} />
                                        Acción Requerida
                                    </h4>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        Este transmittal contiene archivos que deben ser procesados para actualizar el inventario de ingeniería.
                                    </p>
                                    <button
                                        onClick={() => router.push(`/admin/documents/transmittals/${id}/breakdown`)}
                                        className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        PROCESAR AHORA
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
