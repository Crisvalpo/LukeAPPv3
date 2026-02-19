'use client'

import { useState } from 'react'
import { ArrowLeft, FileText, History, Share2, Tag, Calendar, User, Download, FileCode, Plus } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { useRouter } from 'next/navigation'
import RevisionsList from './RevisionsList'
import DocumentHistoryPreview from './DocumentHistoryPreview'
import UploadRevisionModal from './UploadRevisionModal'
import { formatDate } from '@/lib/utils'
import type { DocumentMaster, DocumentRevision, DocumentEvent } from '@/types/document-control'

interface DocumentDetailsViewProps {
    document: DocumentMaster
    revisions: DocumentRevision[]
    history: DocumentEvent[]
}

export default function DocumentDetailsView({ document, revisions, history }: DocumentDetailsViewProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'revisions' | 'history' | 'transmittals'>('revisions')
    const [showUploadModal, setShowUploadModal] = useState(false)

    return (
        <div className="space-y-6">
            {/* Go Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={16} />
                <span>Volver al Control Documental</span>
            </button>

            {/* Header */}
            <header className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />

                <div className="relative flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                            <FileText size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-slate-700/50 border border-white/10 text-white text-xs font-mono px-2 py-0.5 rounded">
                                    {document.document_code}
                                </span>
                                {document.document_type && (
                                    <span className="bg-slate-700/50 border border-white/10 text-slate-300 text-xs px-2 py-0.5 rounded">
                                        {document.document_type.code}
                                    </span>
                                )}
                                {document.area && (
                                    <span className="bg-slate-700/50 border border-white/10 text-slate-400 text-xs px-2 py-0.5 rounded font-mono" title={document.area.name || ''}>
                                        {document.area.code}
                                    </span>
                                )}
                                <span className={`bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded font-medium border border-blue-500/20`}>
                                    {document.status}
                                </span>
                            </div>
                            <Heading level={2} className="text-2xl text-white mb-2">{document.title}</Heading>
                            <Text className="text-slate-400 max-w-2xl">{document.description || 'Sin descripción'}</Text>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <div className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5">
                            <User size={16} className="text-slate-500" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Creado Por</span>
                                <span>{(document as any).creator?.full_name || 'Sistema'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5">
                            <Calendar size={16} className="text-slate-500" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Fecha Creación</span>
                                <span>{formatDate(document.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs & Content */}
            <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 shadow-xl min-h-[500px]">
                {/* Tabs Header */}
                <div className="flex gap-6 border-b border-white/10 mb-6">
                    <TabButton
                        active={activeTab === 'revisions'}
                        onClick={() => setActiveTab('revisions')}
                        icon={FileCode}
                        label="Iteraciones"
                        count={revisions.length}
                    />
                    <TabButton
                        active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                        icon={History}
                        label="Traza Histórica"
                    />
                    <TabButton
                        active={activeTab === 'transmittals'}
                        onClick={() => setActiveTab('transmittals')}
                        icon={Share2}
                        label="Transmittals"
                        disabled={true}
                    />
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'revisions' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <Heading level={4} className="text-white">Iteraciones del Documento</Heading>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <Plus size={14} />
                                    Nueva Revisión
                                </button>
                            </div>
                            <RevisionsList revisions={revisions} />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="max-w-3xl">
                            <div className="mb-6">
                                <Heading level={4} className="text-white">Historial de Eventos</Heading>
                                <Text className="text-slate-400 text-sm">Registro de auditoría completo de todas las acciones sobre el documento.</Text>
                            </div>
                            <DocumentHistoryPreview events={history} />
                        </div>
                    )}

                    {activeTab === 'transmittals' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Share2 size={48} className="text-slate-600 mb-4" />
                            <Heading level={3} className="text-slate-500">Próximamente</Heading>
                            <Text className="text-slate-600">La gestión de transmittals estará disponible en la siguiente fase.</Text>
                        </div>
                    )}
                </div>
            </div>

            <UploadRevisionModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    router.refresh()
                }}
                document={document}
            />
        </div>
    )
}

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
    count,
    disabled = false
}: {
    active: boolean
    onClick: () => void
    icon: any
    label: string
    count?: number
    disabled?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center gap-2 pb-3 border-b-2 transition-all text-sm font-medium
                ${active
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <Icon size={16} />
            {label}
            {count !== undefined && (
                <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${active ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}
                `}>
                    {count}
                </span>
            )}
        </button>
    )
}
