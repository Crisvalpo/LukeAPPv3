'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Search, FileText, Send, X, AlertCircle } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { searchDocuments, createTransmittal } from '@/services/document-control'
import { DocumentMaster } from '@/types/document-control'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

interface TransmittalWizardProps {
    projectId: string
    companyId: string
    userId: string
}

type WizardStep = 'recipient' | 'select-docs' | 'review'

export default function TransmittalWizard({ projectId, companyId, userId }: TransmittalWizardProps) {
    const router = useRouter()
    const [step, setStep] = useState<WizardStep>('recipient')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [recipient, setRecipient] = useState('')
    const [title, setTitle] = useState('')
    const [notes, setNotes] = useState('')

    // Selection State
    const [searchResults, setSearchResults] = useState<DocumentMaster[]>([])
    const [selectedDocs, setSelectedDocs] = useState<DocumentMaster[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // Step 1: Recipient Info Validation
    const isStep1Valid = recipient.trim().length > 0 && title.trim().length > 0

    // Step 2: Search Documents
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const res = await searchDocuments(projectId, query)
            if (res.success && res.data) {
                // Filter out already selected documents to avoid duplicates in result list?
                // Or just show them as selected. Let's just show results.
                setSearchResults(res.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSearching(false)
        }
    }, [projectId])

    const toggleDocumentSelection = (doc: DocumentMaster) => {
        if (selectedDocs.find(d => d.id === doc.id)) {
            setSelectedDocs(prev => prev.filter(d => d.id !== doc.id))
        } else {
            setSelectedDocs(prev => [...prev, doc])
        }
    }

    // Submit Transmittal
    const handleSubmit = async () => {
        if (selectedDocs.length === 0) {
            alert('Debes seleccionar al menos un documento')
            return
        }

        setIsSubmitting(true)
        try {
            const items = selectedDocs.map(doc => ({
                document_revision_id: doc.current_revision_id!,
                purpose: 'FOR_APPROVAL' as const
            }))

            const res = await createTransmittal({
                project_id: projectId,
                company_id: companyId,
                recipient,
                title,
                notes,
                items
            }, userId)

            if (res.success) {
                // Success! Redirect to dashboard
                // In a real app we might show a success modal or toast
                router.push('/admin/transmittals')
            } else {
                throw new Error(res.message || 'Error al crear transmittal')
            }
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
            {/* Header / Stepper logic could go here */}
            <div className="flex items-center justify-between">
                <div>
                    <Heading level={2} className="text-white">Nuevo Transmittal</Heading>
                    <Text className="text-slate-400">Crear un nuevo envío oficial de documentación</Text>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <span>Code:</span>
                    <span className="text-purple-400">TRN-XXX</span>
                </div>
            </div>

            {/* Steps Progress */}
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <div className={`flex items-center gap-2 ${step === 'recipient' ? 'text-purple-400' : 'text-slate-300'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 'recipient' ? 'border-purple-500 bg-purple-500/20' : 'border-emerald-500 bg-emerald-500/20 text-emerald-500'}`}>
                        {step === 'recipient' ? '1' : <Check size={14} />}
                    </div>
                    Información
                </div>
                <div className="w-8 h-px bg-slate-800" />
                <div className={`flex items-center gap-2 ${step === 'select-docs' ? 'text-purple-400' : selectedDocs.length > 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 'select-docs' ? 'border-purple-500 bg-purple-500/20' : step === 'review' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500' : 'border-slate-700'}`}>
                        {step === 'review' ? <Check size={14} /> : '2'}
                    </div>
                    Documentos
                </div>
                <div className="w-8 h-px bg-slate-800" />
                <div className={`flex items-center gap-2 ${step === 'review' ? 'text-purple-400' : 'text-slate-600'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 'review' ? 'border-purple-500 bg-purple-500/20' : 'border-slate-700'}`}>
                        3
                    </div>
                    Revisión
                </div>
            </div>

            {/* Step 1: Recipient Info */}
            {step === 'recipient' && (
                <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destinatario *</label>
                            <input
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                placeholder="Nombre de la persona o entidad receptora"
                                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Asunto / Título *</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ej: Entrega de planos estructurales para revisión"
                                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notas Adicionales</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={4}
                                placeholder="Mensaje opcional para el destinatario..."
                                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setStep('select-docs')}
                            disabled={!isStep1Valid}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                        >
                            Siguiente: Seleccionar Documentos
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Select Documents */}
            {step === 'select-docs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Buscar documentos por código o título..."
                            className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-xl"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Search Results */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Heading level={4} className="text-slate-300 text-sm uppercase tracking-wider">Resultados de Búsqueda</Heading>
                                {isSearching && <span className="text-xs text-purple-400 animate-pulse">Buscando...</span>}
                            </div>

                            <div className="bg-[#1e293b] border border-white/5 rounded-2xl overflow-hidden min-h-[300px] max-h-[500px] overflow-y-auto">
                                {searchResults.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
                                        <FileText size={32} className="opacity-20" />
                                        <p className="text-sm text-center">
                                            {searchQuery.length < 2 ? 'Escribe al menos 2 caracteres para buscar' : 'No se encontraron documentos'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {searchResults.map(doc => {
                                            const isSelected = selectedDocs.some(d => d.id === doc.id)
                                            return (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => toggleDocumentSelection(doc)}
                                                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors flex items-start justify-between group ${isSelected ? 'bg-purple-500/5' : ''}`}
                                                >
                                                    <div>
                                                        <div className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                                                            {doc.document_code}
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-1 line-clamp-1">{doc.title}</div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                                                                Rev: {doc.current_revision?.rev_code || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-600 group-hover:border-slate-400'}`}>
                                                        {isSelected && <Check size={12} />}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Documents */}
                        <div className="space-y-3">
                            <Heading level={4} className="text-slate-300 text-sm uppercase tracking-wider flex items-center justify-between">
                                <span>Seleccionados</span>
                                <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">{selectedDocs.length}</span>
                            </Heading>

                            <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl overflow-hidden min-h-[300px] max-h-[500px] overflow-y-auto">
                                {selectedDocs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
                                        <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                                            <ArrowRight size={20} className="opacity-50" />
                                        </div>
                                        <p className="text-sm text-center max-w-[200px]">
                                            Selecciona documentos de la lista de resultados
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {selectedDocs.map(doc => (
                                            <div key={`selected-${doc.id}`} className="p-4 flex items-start justify-between bg-[#1e293b]">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">
                                                        {doc.document_code}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1 line-clamp-1">{doc.title}</div>
                                                </div>
                                                <button
                                                    onClick={() => toggleDocumentSelection(doc)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-white/5">
                        <button
                            onClick={() => setStep('recipient')}
                            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            <ArrowLeft size={16} />
                            Volver
                        </button>
                        <button
                            onClick={() => setStep('review')}
                            disabled={selectedDocs.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                        >
                            Siguiente: Revisar y Crear
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
                <div className="bg-[#1e293b] border border-white/5 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Transmittal</h3>
                                <div className="text-xl font-medium text-white">{title}</div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                                        <span className="text-slate-400">Para:</span>
                                        <span className="text-slate-200">{recipient}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                                        <span className="text-slate-400">De:</span>
                                        <span className="text-slate-200">Ingeniería</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                                        <span className="text-slate-400">Fecha:</span>
                                        <span className="text-slate-200">{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Notas</h3>
                                <div className="bg-[#0f172a] rounded-xl p-4 text-sm text-slate-300 min-h-[100px] italic">
                                    {notes || "Sin notas adicionales."}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-[#0f172a]/50">
                        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Documentos Incluidos ({selectedDocs.length})</h3>
                        <div className="bg-[#1e293b] rounded-xl border border-white/5 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-slate-400 text-xs uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Rev</th>
                                        <th className="px-4 py-3">Título</th>
                                        <th className="px-4 py-3 text-right">Propósito</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    {selectedDocs.map(doc => (
                                        <tr key={doc.id}>
                                            <td className="px-4 py-3 font-mono text-white">{doc.document_code}</td>
                                            <td className="px-4 py-3 text-emerald-400">{doc.current_revision?.rev_code}</td>
                                            <td className="px-4 py-3 text-slate-400">{doc.title}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    PARA APROBACIÓN
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 bg-black/20 flex justify-between items-center border-t border-white/5">
                        <button
                            onClick={() => setStep('select-docs')}
                            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                            disabled={isSubmitting}
                        >
                            <ArrowLeft size={16} />
                            Volver y Editar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                                    Creando...
                                </span>
                            ) : (
                                <>
                                    <Send size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                    Confirmar y Enviar Transmittal
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
