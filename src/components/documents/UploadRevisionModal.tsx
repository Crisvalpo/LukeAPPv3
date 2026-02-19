'use client'

import { useState } from 'react'
import { Heading, Text } from '@/components/ui/Typography'
import { X, Upload, FileText, Loader2, Check } from 'lucide-react'
import { prepareRevisionUploadAction, updateDocumentRevisionAction } from '@/app/actions/document-actions'
import { createClient } from '@/lib/supabase/client'
import { DocumentMaster } from '@/types/document-control'
import { toast } from 'sonner' // Assuming sonner is used, if not I'll use simple alert or try/catch

interface UploadRevisionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    document: DocumentMaster
}

export default function UploadRevisionModal({ isOpen, onClose, onSuccess, document }: UploadRevisionModalProps) {
    const [revCode, setRevCode] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [notes, setNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!file || !revCode) return

        try {
            setIsLoading(true)
            const supabase = createClient()

            // 1. Prepare Upload (Create Draft Revision)
            const prepareRes = await prepareRevisionUploadAction({
                documentId: document.id,
                projectId: document.project_id,
                companyId: document.company_id,
                revCode: revCode,
                fileName: file.name,
                fileSize: file.size,
                notes: notes
            })

            if (!prepareRes.success || !prepareRes.data) {
                throw new Error(prepareRes.message || 'Error al preparar la carga')
            }

            const { uploadPath, revisionId } = prepareRes.data

            // 2. Upload File
            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(uploadPath, file)

            if (uploadError) {
                // TODO: Rollback revision?
                throw new Error(`Error al subir archivo: ${uploadError.message}`)
            }

            // 3. Finalize Revision (Set to APPROVED/VIGENTE)
            const updateRes = await updateDocumentRevisionAction(revisionId, {
                status: 'APPROVED', // Assuming APPROVED maps to VIGENTE
                file_url: supabase.storage.from('project-files').getPublicUrl(uploadPath).data.publicUrl
            })

            if (!updateRes.success) {
                throw new Error(updateRes.message || 'Error al finalizar la revisión')
            }

            // Success
            onSuccess()
            onClose()
            resetForm()

        } catch (error: any) {
            console.error(error)
            alert(error.message) // Fallback if sonner not available
        } finally {
            setIsLoading(false)
        }
    }

    function resetForm() {
        setRevCode('')
        setFile(null)
        setNotes('')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                    <div>
                        <Heading level={3} className="text-lg text-white">Nueva Revisión</Heading>
                        <Text className="text-xs text-slate-400 mt-0.5">{document.document_code}</Text>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="upload-rev-form" onSubmit={handleSubmit} className="space-y-5">

                        {/* Revision Code */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Código de Revisión *</label>
                            <input
                                required
                                type="text"
                                value={revCode}
                                onChange={(e) => setRevCode(e.target.value)}
                                placeholder="Ej: A, B, 0, 1"
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* File Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Archivo *</label>
                            <div className={`
                                border-2 border-dashed rounded-xl p-6 text-center transition-all
                                ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-blue-500/50 hover:bg-white/5'}
                            `}>
                                <input
                                    type="file"
                                    id="rev-file-upload"
                                    className="hidden"
                                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                />
                                <label htmlFor="rev-file-upload" className="cursor-pointer block w-full h-full">
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
                                                Seleccionar archivo
                                            </div>
                                            <Text className="text-slate-500 text-xs">PDF, Excel, Word, DWG</Text>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Notas de la Revisión</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Descripción de los cambios..."
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                            />
                        </div>
                    </form>
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
                        form="upload-rev-form"
                        disabled={isLoading || !file || !revCode}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                        {isLoading ? 'Cargando...' : 'Cargar Revisión'}
                    </button>
                </div>
            </div>
        </div>
    )
}
