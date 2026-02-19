'use client'

import { DocumentEvent } from '@/types/document-control'
import { CheckCircle, Clock, FileText, Send, AlertCircle, Edit, PlayCircle } from 'lucide-react'
import { Text } from '@/components/ui/Typography'
import { formatDate } from '@/lib/utils'

interface DocumentHistoryPreviewProps {
    events: DocumentEvent[]
}

export default function DocumentHistoryPreview({ events }: DocumentHistoryPreviewProps) {
    if (!events || events.length === 0) {
        return (
            <div className="p-8 text-center border border-white/5 rounded-xl bg-white/5">
                <Text className="text-slate-400">No hay actividad registrada.</Text>
            </div>
        )
    }

    return (
        <div className="relative border-l border-white/10 ml-3 space-y-6">
            {events.map((event) => (
                <div key={event.id} className="relative pl-6 group">
                    {/* Icon */}
                    <div className="absolute -left-3 top-0 p-1 bg-[#0f172a] rounded-full border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        <EventIcon type={event.event_type} />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-200">
                                {getEventTitle(event.event_type)}
                            </span>
                            <span className="text-xs text-slate-500">
                                {formatDate(event.created_at)}
                            </span>
                        </div>

                        <div className="text-sm text-slate-400">
                            <EventDescription event={event} />
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                {(event.creator?.full_name || event.creator?.email || '?').charAt(0).toUpperCase()}
                            </div>
                            {event.creator?.full_name || event.creator?.email || 'Sistema'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function EventIcon({ type }: { type: string }) {
    switch (type) {
        case 'CREATED': return <PlayCircle size={14} className="text-emerald-400" />
        case 'REVISION_UPLOADED': return <FileText size={14} className="text-blue-400" />
        case 'STATUS_CHANGED': return <Edit size={14} className="text-yellow-400" />
        case 'TRANSMITTED': return <Send size={14} className="text-purple-400" />
        case 'FROZEN': return <AlertCircle size={14} className="text-cyan-400" />
        case 'UNFROZEN': return <CheckCircle size={14} className="text-cyan-400" />
        default: return <Clock size={14} className="text-slate-400" />
    }
}

function getEventTitle(type: string): string {
    switch (type) {
        case 'CREATED': return 'Documento Creado'
        case 'REVISION_UPLOADED': return 'Revisión Cargada'
        case 'STATUS_CHANGED': return 'Cambio de Estado'
        case 'TRANSMITTED': return 'Transmitido'
        case 'FROZEN': return 'Congelado'
        case 'UNFROZEN': return 'Descongelado'
        default: return 'Evento'
    }
}

function EventDescription({ event }: { event: DocumentEvent }) {
    const { payload } = event

    if (event.event_type === 'CREATED') {
        return <span>Documento registrado inicialmente como <strong>{payload.document_code}</strong></span>
    }

    if (event.event_type === 'REVISION_UPLOADED') {
        return (
            <span>
                Cargada revisión <strong>{payload.rev_code}</strong>
                {payload.file_name && <span className="text-slate-500 italic"> ({payload.file_name})</span>}
            </span>
        )
    }

    if (event.event_type === 'STATUS_CHANGED') {
        return (
            <span>
                Estado cambió de <span className="text-slate-500">{payload.old_status}</span> a <strong className="text-slate-300">{payload.new_status}</strong>
            </span>
        )
    }

    if (event.event_type === 'TRANSMITTED') {
        return <span>Enviado en Transmittal <strong>{payload.transmittal_code}</strong></span>
    }

    return <span className="italic opacity-60">Detalles no disponibles</span>
}
