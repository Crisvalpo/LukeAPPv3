'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    FileText, Plus, Search, Filter, FolderOpen,
    ChevronDown, ExternalLink, RefreshCw, FileCheck,
    Clock, Send, BarChart3, ArrowDownCircle
} from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import UploadDocumentModal from '@/components/documents/UploadDocumentModal'
import TransmittalReceptionModal from '@/components/documents/TransmittalReceptionModal'
import DocumentControlHeader from '@/components/documents/DocumentControlHeader'
import {
    getDocuments,
    getDocumentTypes,
    getSpecialties,
    getProjectAreas,
    getDocumentControlKPIs
} from '@/services/document-control'
import type { DocumentMaster, DocumentFilters, DocumentControlKPIs, ProjectArea } from '@/types/document-control'
import { DocumentStatus } from '@/types/document-control'

// ─── Status badge helpers ───────────────────────────────────────────────────

const RevStatusConfig: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Borrador', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    UNDER_REVIEW: { label: 'En Revisión', cls: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
    APPROVED: { label: 'Aprobado', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    REJECTED: { label: 'Rechazado', cls: 'bg-red-500/10    text-red-400    border-red-500/20' },
    SUPERSEDED: { label: 'Superado', cls: 'bg-purple-500/10 text-purple-400  border-purple-500/20' },
}

const DocStatusConfig: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'Activo', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    CANCELLED: { label: 'Anulado', cls: 'bg-red-500/10    text-red-400    border-red-500/20' },
    ON_HOLD: { label: 'En Pausa', cls: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Specialty { id: string; name: string; code: string }
interface DocType { id: string; name: string; code: string }

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
    const router = useRouter()

    // Context
    const [projectId, setProjectId] = useState<string | null>(null)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Data
    const [documents, setDocuments] = useState<DocumentMaster[]>([])
    const [specialties, setSpecialties] = useState<Specialty[]>([])
    const [docTypes, setDocTypes] = useState<DocType[]>([])
    const [areas, setAreas] = useState<ProjectArea[]>([])
    const [kpis, setKpis] = useState<DocumentControlKPIs>({
        total_documents: 0, pending_review: 0, approved_this_month: 0, transmittals_this_month: 0
    })

    // Filters
    const [search, setSearch] = useState('')
    const [filterSpec, setFilterSpec] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterArea, setFilterArea] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    // UI
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showReceptionModal, setShowReceptionModal] = useState(false)

    // ── Load context ──────────────────────────────────────────────────────────
    useEffect(() => { loadContext() }, [])

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

    // ── Load catalog (specialties + types) ────────────────────────────────────
    useEffect(() => {
        if (!companyId || !projectId) return
        Promise.all([
            getSpecialties(companyId),
            getDocumentTypes(companyId),
            getProjectAreas(projectId)
        ]).then(([specRes, typeRes, areaRes]) => {
            if (specRes.success && specRes.data) setSpecialties(specRes.data)
            if (typeRes.success && typeRes.data) setDocTypes(typeRes.data as DocType[])
            if (areaRes.success && areaRes.data) setAreas(areaRes.data)
        })
    }, [companyId, projectId])

    // ── Load documents + KPIs ─────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!projectId) return
        setIsLoading(true)

        const filters: DocumentFilters = {
            search: search || undefined,
            specialty_id: filterSpec || undefined,
            document_type_id: filterType || undefined,
            area_id: filterArea || undefined,
            status: filterStatus as any || undefined,
        }

        const [docsRes, kpisRes] = await Promise.all([
            getDocuments(projectId, filters),
            getDocumentControlKPIs(projectId),
        ])

        if (docsRes.success && docsRes.data) setDocuments(docsRes.data)
        if (kpisRes.success && kpisRes.data) setKpis(kpisRes.data)

        setIsLoading(false)
    }, [projectId, search, filterSpec, filterType, filterArea, filterStatus])

    useEffect(() => { if (projectId) loadData() }, [loadData, projectId])

    // ── Guards ────────────────────────────────────────────────────────────────
    if (isLoading && !projectId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
            </div>
        )
    }

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <FolderOpen className="w-16 h-16 text-slate-500" />
                <Heading level={2}>Sin proyecto asignado</Heading>
                <Text className="text-slate-400">Debes estar asignado a un proyecto para acceder.</Text>
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

            {/* Header */}
            <DocumentControlHeader
                title="Registro de Documentos"
                subtitle={`${documents.length} documentos registrados`}
                onRefresh={loadData}
                isLoading={isLoading}
                primaryAction={{
                    label: "Registrar Documento",
                    icon: <Plus size={18} />,
                    onClick: () => setShowUploadModal(true)
                }}
                secondaryAction={{
                    label: "Recibir Transmittal",
                    icon: <ArrowDownCircle size={18} />,
                    onClick: () => setShowReceptionModal(true)
                }}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Documentos', value: kpis.total_documents, icon: FileText, color: 'from-blue-500   to-blue-600', sub: 'en proyecto' },
                    { label: 'En Revisión', value: kpis.pending_review, icon: Clock, color: 'from-amber-500  to-orange-600', sub: 'pendientes' },
                    { label: 'Aprobados (mes)', value: kpis.approved_this_month, icon: FileCheck, color: 'from-emerald-500 to-green-600', sub: 'este mes' },
                    { label: 'Transmittals (mes)', value: kpis.transmittals_this_month, icon: Send, color: 'from-purple-500 to-violet-600', sub: 'emitidos' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg shadow-black/20`}>
                                <kpi.icon size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                                <p className="text-xs text-slate-400">{kpi.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-[#1e293b]/50 border border-white/5 rounded-xl p-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar código, título..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={14} />
                    <span className="text-xs font-semibold uppercase">Filtros:</span>
                </div>

                {/* Especialidad */}
                <div className="relative">
                    <select
                        value={filterSpec}
                        onChange={e => setFilterSpec(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                    >
                        <option value="">Especialidad (Todas)</option>
                        {specialties.map(s => (
                            <option key={s.id} value={s.id}>{s.code} – {s.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                {/* Tipo */}
                <div className="relative">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                    >
                        <option value="">Tipo (Todos)</option>
                        {docTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.code} – {t.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                {/* Área */}
                <div className="relative">
                    <select
                        value={filterArea}
                        onChange={e => setFilterArea(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                    >
                        <option value="">Área (Todas)</option>
                        {areas.map(a => (
                            <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                {/* Estado */}
                <div className="relative">
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                    >
                        <option value="">Estado (Todos)</option>
                        <option value={DocumentStatus.ACTIVE}>Activo</option>
                        <option value={DocumentStatus.CANCELLED}>Anulado</option>
                        <option value={DocumentStatus.ON_HOLD}>En Pausa</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

                {/* Clear filters */}
                {(search || filterSpec || filterType || filterArea || filterStatus) && (
                    <button
                        onClick={() => {
                            setSearch(''); setFilterSpec(''); setFilterType('');
                            setFilterArea(''); setFilterStatus('')
                        }}
                        className="px-3 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Document Table */}
            <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-xl">

                {isLoading ? (
                    <div className="flex items-center justify-center py-24 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                        <span className="text-slate-400 text-sm">Cargando documentos...</span>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-full border border-white/5">
                            <FileText size={48} className="text-slate-600" />
                        </div>
                        <div className="text-center">
                            <Text className="text-slate-300 text-lg font-medium">No se encontraron documentos</Text>
                            <Text className="text-slate-500 text-sm mt-1">
                                {(search || filterSpec || filterType || filterArea || filterStatus)
                                    ? 'Prueba ajustando los filtros.'
                                    : 'Sube el primer documento del proyecto.'}
                            </Text>
                        </div>
                        {!search && !filterSpec && !filterType && !filterArea && !filterStatus && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                <Plus size={16} /> Subir primer documento
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-12">#</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 min-w-[120px]">Código</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 min-w-[280px]">Nombre Documento</th>
                                    <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-16">Rev</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Tipo</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Especialidad</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden xl:table-cell w-28">Área</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Estado</th>
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Fecha</th>
                                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-20">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {documents.map((doc, idx) => {
                                    const docStatusCfg = DocStatusConfig[doc.status] ?? { label: doc.status, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
                                    const areaStr = doc.area ? `${doc.area.code}` : '—'

                                    return (
                                        <tr
                                            key={doc.id}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            {/* # */}
                                            <td className="px-4 py-3 text-slate-500 text-xs font-mono tabular-nums">{idx + 1}</td>

                                            {/* Código */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-blue-300 bg-blue-500/8 border border-blue-500/20 px-2 py-0.5 rounded">
                                                    {doc.document_code}
                                                </span>
                                            </td>

                                            {/* Nombre */}
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/documents/${doc.id}`}
                                                    className="font-medium text-white hover:text-blue-300 transition-colors line-clamp-1"
                                                >
                                                    {doc.title}
                                                </Link>
                                                {doc.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{doc.description}</p>
                                                )}
                                            </td>

                                            {/* Rev */}
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-mono text-xs bg-slate-800 border border-white/10 px-2 py-0.5 rounded text-slate-300">
                                                    {doc.current_revision?.rev_code ?? '—'}
                                                </span>
                                            </td>

                                            {/* Tipo */}
                                            <td className="px-4 py-3 hidden xl:table-cell">
                                                <span className="text-xs text-slate-300">
                                                    {doc.document_type?.name ?? '—'}
                                                </span>
                                            </td>

                                            {/* Especialidad */}
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                {doc.specialty ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                                                        <span className="font-mono text-slate-500 text-[10px]">{doc.specialty.code}</span>
                                                        {doc.specialty.name}
                                                    </span>
                                                ) : <span className="text-slate-600 text-xs">—</span>}
                                            </td>

                                            {/* Área */}
                                            <td className="px-4 py-3 hidden xl:table-cell">
                                                {doc.area ? (
                                                    <span className="font-mono text-xs text-slate-400" title={doc.area.name || ''}>
                                                        {doc.area.code}
                                                    </span>
                                                ) : <span className="text-slate-600 text-xs">—</span>}
                                            </td>

                                            {/* Estado */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${docStatusCfg.cls}`}>
                                                    {docStatusCfg.label}
                                                </span>
                                            </td>

                                            {/* Fecha */}
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className="text-xs text-slate-400">
                                                    {new Date(doc.created_at).toLocaleDateString('es-CL')}
                                                </span>
                                            </td>

                                            {/* Acción */}
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/admin/documents/${doc.id}`}
                                                    className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <ExternalLink size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Footer summary */}
                        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Mostrando <span className="text-slate-300 font-medium">{documents.length}</span> documentos
                            </span>
                            <Link
                                href="/admin/documents/transmittals"
                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                            >
                                <Send size={12} /> Ver Transmittals
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && companyId && (
                <UploadDocumentModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    projectId={projectId!}
                    companyId={companyId}
                    onSuccess={loadData}
                />
            )}

            {/* Reception Modal */}
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
