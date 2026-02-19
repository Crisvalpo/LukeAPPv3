'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { DocumentType } from '@/types/document-control'
import { updateDocumentRevisionAction } from '@/app/actions/document-actions'
import { toast } from 'sonner' // Assuming sonner is available, effectively handling alerts

interface UploadDocumentModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    companyId: string
    onSuccess: () => void
}

interface Specialty {
    id: string
    name: string
    code: string
}

interface ProjectArea {
    id: string
    name: string | null
    code: string
}

export default function UploadDocumentModal({
    isOpen,
    onClose,
    projectId,
    companyId,
    onSuccess
}: UploadDocumentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetchingInfo, setIsFetchingInfo] = useState(true)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [documentTypeId, setDocumentTypeId] = useState('')
    const [specialtyId, setSpecialtyId] = useState('')
    const [areaId, setAreaId] = useState('')
    const [file, setFile] = useState<File | null>(null)

    // Data Lists
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
    const [specialties, setSpecialties] = useState<Specialty[]>([])
    const [areas, setAreas] = useState<ProjectArea[]>([])

    useEffect(() => {
        if (isOpen && companyId) {
            fetchConfiguration()
        }
    }, [isOpen, companyId])

    async function fetchConfiguration() {
        setIsFetchingInfo(true)
        const supabase = createClient()

        // Parallel fetch
        const [typesPromise, specsPromise, areasPromise] = await Promise.allSettled([
            supabase.from('document_types').select('*').eq('company_id', companyId).eq('is_active', true),
            supabase.from('specialties').select('id, name, code').eq('company_id', companyId),
            supabase.from('project_areas').select('id, name, code').eq('project_id', projectId).eq('is_active', true)
        ])

        if (typesPromise.status === 'fulfilled' && typesPromise.value.data) {
            setDocumentTypes(typesPromise.value.data)
        }

        if (specsPromise.status === 'fulfilled' && specsPromise.value.data) {
            setSpecialties(specsPromise.value.data)
        }

        if (areasPromise.status === 'fulfilled' && areasPromise.value.data) {
            setAreas(areasPromise.value.data)
        }

        setIsFetchingInfo(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title || !documentTypeId || !file) return

        setIsLoading(true)
        try {
            // 1. Create Document Metadata & Get Upload Path
            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    company_id: companyId,
                    document_type_id: documentTypeId,
                    specialty_id: specialtyId || null,
                    area_id: areaId || null,
                    title,
                    description,
                    file_name: file.name,
                    file_size: file.size
                })
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.message)
            }

            const { data } = result
            const { uploadPath, revisionId } = data // document data

            if (!uploadPath || !revisionId) {
                // Should not happen if file was provided in body
                throw new Error('No se recibió la ruta de carga.')
            }

            // 2. Upload File to Supabase Storage
            const supabase = createClient()
            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(uploadPath, file)

            if (uploadError) {
                // If upload fails, we should probably rollback? 
                // For now, just alert. User can retry later or we end up with DRAFT rev without file.
                throw new Error(`Error subiendo archivo: ${uploadError.message}`)
            }

            // 3. Confirm Upload (Update Status to APPROVED/UNDER_REVIEW)
            // Ideally should be UNDER_REVIEW, but for now specific requirement not set.
            // Let's set to APPROVED to match behavior of simple upload.
            const updateRes = await updateDocumentRevisionAction(revisionId, {
                status: 'APPROVED',
                // file_url is implicit if we know the path, but storage generates signed URL?
                // Actually we just store the path or public URL?
                // document_revisions table has file_url.
                // Usually we store the Relative Path or Full Public URL.
                // updateDocumentRevisionAction updates the DB.
                // Let's store the PATH for now if referencing storage.
                // Or Public URL if bucket is public.
                // bucket is public.
                // URL: supabase.storage.from('project-files').getPublicUrl(uploadPath).data.publicUrl
                file_url: supabase.storage.from('project-files').getPublicUrl(uploadPath).data.publicUrl
            })

            if (!updateRes.success) {
                throw new Error(`Error actualizando revisión: ${updateRes.message}`)
            }

            // Success
            onSuccess()
            onClose()
            resetForm()

        } catch (error: any) {
            console.error(error)
            alert(error.message) // Simple alert for now
        } finally {
            setIsLoading(false)
        }
    }

    function resetForm() {
        setTitle('')
        setDescription('')
        setDocumentTypeId('')
        setSpecialtyId('')
        setAreaId('')
        setFile(null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                    <div>
                        <Heading level={3} className="text-lg text-white">Nuevo Documento</Heading>
                        <Text className="text-xs text-slate-400 mt-0.5">Carga un documento general al proyecto</Text>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {isFetchingInfo ? (
                        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                            <Loader2 className="animate-spin" size={20} />
                            <span>Cargando configuración...</span>
                        </div>
                    ) : (
                        <form id="upload-doc-form" onSubmit={handleSubmit} className="space-y-5">
                            {/* File Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Archivo</label>
                                <div className={`
                                    border-2 border-dashed rounded-xl p-6 text-center transition-all
                                    ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-blue-500/50 hover:bg-white/5'}
                                `}>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                                        {file ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                                                    <Check size={24} />
                                                </div>
                                                <div className="text-sm font-medium text-emerald-300 truncate max-w-full px-4">
                                                    {file.name}
                                                </div>
                                                <Text className="text-slate-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-2 bg-blue-500/10 rounded-full text-blue-400">
                                                    <Upload size={24} />
                                                </div>
                                                <div className="text-sm font-medium text-slate-300">
                                                    Haz clic para seleccionar
                                                </div>
                                                <Text className="text-slate-500 text-xs">Soporta PDF, Excel, Word, DWG</Text>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Metadata Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Tipo de Documento *</label>
                                    <select
                                        required
                                        value={documentTypeId}
                                        onChange={(e) => setDocumentTypeId(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {documentTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Especialidad</label>
                                    <select
                                        value={specialtyId}
                                        onChange={(e) => setSpecialtyId(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    >
                                        <option value="">General (GEN)</option>
                                        {specialties.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Area field */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400">Área del Proyecto</label>
                                <select
                                    value={areaId}
                                    onChange={(e) => setAreaId(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                >
                                    <option value="">Sin área específica</option>
                                    {areas.map(a => (
                                        <option key={a.id} value={a.id}>{a.code} – {a.name || 'Área'}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400">Título del Documento *</label>
                                <input
                                    required
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: Memoria de Cálculo Estructural"
                                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400">Descripción (Opcional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="upload-doc-form"
                        disabled={isLoading || isFetchingInfo || !file}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                        {isLoading ? 'Creando...' : 'Crear Documento'}
                    </button>
                </div>
            </div>
        </div>
    )
}
