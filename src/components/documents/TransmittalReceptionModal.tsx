'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, FileArchive, FileSpreadsheet, Check, Loader2, Send, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { TransmittalDirectionType } from '@/types/document-control'
import { toast } from 'sonner'

interface TransmittalReceptionModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    companyId: string
    onSuccess: () => void
}

export default function TransmittalReceptionModal({
    isOpen,
    onClose,
    projectId,
    companyId,
    onSuccess
}: TransmittalReceptionModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState('')
    const [recipient, setRecipient] = useState('')
    const [notes, setNotes] = useState('')
    const [direction, setDirection] = useState<TransmittalDirectionType>('INCOMING')
    const [packageFile, setPackageFile] = useState<File | null>(null)
    const [manifestFile, setManifestFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title || !packageFile) {
            toast.error('Título y Archivo del Paquete son obligatorios')
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            // 1. Get Company and Project info for storage paths
            const { data: company } = await supabase.from('companies').select('slug').eq('id', companyId).single()
            const { data: project } = await supabase.from('projects').select('code').eq('id', projectId).single()

            if (!company || !project) throw new Error('Información de empresa o proyecto no encontrada')

            // 2. Upload Package (ZIP)
            const packagePath = `${company.slug}-${companyId}/${project.code}-${projectId}/documents/transmittals/${direction}/${Date.now()}_${packageFile.name}`
            const { error: pkgError } = await supabase.storage.from('project-files').upload(packagePath, packageFile)
            if (pkgError) throw pkgError
            const packageUrl = supabase.storage.from('project-files').getPublicUrl(packagePath).data.publicUrl

            // 3. Upload Manifest (Optional)
            let manifestUrl = null
            if (manifestFile) {
                const manifestPath = `${company.slug}-${companyId}/${project.code}-${projectId}/documents/transmittals/${direction}/${Date.now()}_${manifestFile.name}`
                const { error: manError } = await supabase.storage.from('project-files').upload(manifestPath, manifestFile)
                if (manError) throw manError
                manifestUrl = supabase.storage.from('project-files').getPublicUrl(manifestPath).data.publicUrl
            }

            // 4. Create Transmittal Record via API (using existing endpoint if updated or direct supabase for now)
            // Note: We already updated createTransmittal service to handle these fields.
            // We'll call an API route that uses that service.
            const response = await fetch('/api/documents/transmittals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    company_id: companyId,
                    title,
                    recipient,
                    notes,
                    direction,
                    package_url: packageUrl,
                    manifest_url: manifestUrl,
                    items: [] // Initially empty, breakdown happens later
                })
            })

            const result = await response.json()
            if (!result.success) throw new Error(result.message)

            toast.success('Transmittal registrado exitosamente')
            onSuccess()
            onClose()
            resetForm()

        } catch (error: any) {
            console.error(error)
            toast.error(`Error: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    function resetForm() {
        setTitle('')
        setRecipient('')
        setNotes('')
        setDirection('INCOMING')
        setPackageFile(null)
        setManifestFile(null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Send size={20} />
                        </div>
                        <div>
                            <Heading level={3} className="text-lg text-white">Recepción de Transmittal</Heading>
                            <Text className="text-xs text-slate-400 mt-0.5">Registra un paquete de documentos entrante o saliente</Text>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form id="transmittal-reception-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Direction Toggle */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dirección del Envío</label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0f172a] rounded-xl border border-white/5 font-medium">
                            <button
                                type="button"
                                onClick={() => setDirection('INCOMING')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${direction === 'INCOMING' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <ArrowDownCircle size={16} />
                                Recibido (Entrante)
                            </button>
                            <button
                                type="button"
                                onClick={() => setDirection('OUTGOING')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${direction === 'OUTGOING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <ArrowUpCircle size={16} />
                                Emitido (Saliente)
                            </button>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex-1">
                            <label className="text-xs font-medium text-slate-400">Código/Título del Transmittal *</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: K484-KT-EIMISA1-T-1345"
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Remitente / Destinatario</label>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="Ej: EIMISA S.A."
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    {/* Files Upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Package (ZIP) */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paquete de Archivos (ZIP/RAR) *</label>
                            <div className={`
                                border-2 border-dashed rounded-xl p-4 text-center transition-all min-h-[120px] flex flex-col justify-center
                                ${packageFile ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/30 hover:bg-white/5'}
                            `}>
                                <input
                                    type="file"
                                    id="package-upload"
                                    className="hidden"
                                    accept=".zip,.rar,.7z"
                                    onChange={(e) => e.target.files && setPackageFile(e.target.files[0])}
                                />
                                <label htmlFor="package-upload" className="cursor-pointer">
                                    {packageFile ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="p-1.5 bg-blue-500/20 rounded-full text-blue-400">
                                                <Check size={18} />
                                            </div>
                                            <span className="text-xs font-medium text-blue-300 truncate max-w-[180px]">{packageFile.name}</span>
                                            <span className="text-[10px] text-slate-500">{(packageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <FileArchive size={24} className="text-slate-500 mb-1" />
                                            <span className="text-xs font-medium text-slate-300">Seleccionar ZIP</span>
                                            <span className="text-[10px] text-slate-500 text-center">Contiene todos los documentos</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Manifest (Excel) */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manifiesto / Control (Excel/PDF)</label>
                            <div className={`
                                border-2 border-dashed rounded-xl p-4 text-center transition-all min-h-[120px] flex flex-col justify-center
                                ${manifestFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-emerald-500/30 hover:bg-white/5'}
                            `}>
                                <input
                                    type="file"
                                    id="manifest-upload"
                                    className="hidden"
                                    accept=".xlsx,.xls,.pdf"
                                    onChange={(e) => e.target.files && setManifestFile(e.target.files[0])}
                                />
                                <label htmlFor="manifest-upload" className="cursor-pointer">
                                    {manifestFile ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-400">
                                                <Check size={18} />
                                            </div>
                                            <span className="text-xs font-medium text-emerald-300 truncate max-w-[180px]">{manifestFile.name}</span>
                                            <span className="text-[10px] text-slate-500">{(manifestFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <FileSpreadsheet size={24} className="text-slate-500 mb-1" />
                                            <span className="text-xs font-medium text-slate-300">Seleccionar Manifiesto</span>
                                            <span className="text-[10px] text-slate-500 text-center">Excel de control del envío</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">Notas Adicionales</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Comentarios sobre el recepción o contenido del transmittal..."
                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                        />
                    </div>
                </form>

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
                        form="transmittal-reception-form"
                        disabled={isLoading || !packageFile || !title}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        {isLoading ? 'Registrando...' : 'Registrar Transmittal'}
                    </button>
                </div>
            </div>
        </div>
    )
}
