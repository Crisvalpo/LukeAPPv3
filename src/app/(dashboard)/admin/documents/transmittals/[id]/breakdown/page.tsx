'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    ChevronLeft, PackageOpen, FileText, CheckCircle2,
    AlertCircle, Loader2, Download, Table, List,
    RefreshCw, Play, Save
} from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { getTransmittal } from '@/services/document-control'
import { Transmittal } from '@/types/document-control'
import { toast } from 'sonner'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'

interface UnzippedFile {
    name: string
    size: number
    type: string
    relative_path: string
}

interface ManifestItem {
    code: string
    title: string
    revision: string
    filename: string
    document_type_id: string
    specialty_id: string
    status: 'MATCHED' | 'MISSING_FILE' | 'EXTRA_FILE'
}

interface DocType { id: string; name: string; code: string }
interface Specialty { id: string; name: string; code: string }

export default function TransmittalBreakdownPage() {
    const { id } = useParams()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transmittal, setTransmittal] = useState<Transmittal | null>(null)

    const [zipFiles, setZipFiles] = useState<UnzippedFile[]>([])
    const [manifestData, setManifestData] = useState<any[]>([])
    const [breakdownItems, setBreakdownItems] = useState<ManifestItem[]>([])

    const [docTypes, setDocTypes] = useState<DocType[]>([])
    const [specialties, setSpecialties] = useState<Specialty[]>([])
    const [zipInstance, setZipInstance] = useState<JSZip | null>(null)

    const loadData = useCallback(async () => {
        if (!id) return
        setIsLoading(true)
        const res = await getTransmittal(id as string)
        if (res.success && res.data) {
            setTransmittal(res.data)

            // Fetch configuration
            const supabase = createClient()
            const [typesRes, specsRes] = await Promise.all([
                supabase.from('document_types').select('id, name, code').eq('company_id', res.data.company_id),
                supabase.from('specialties').select('id, name, code').eq('company_id', res.data.company_id)
            ])
            if (typesRes.data) setDocTypes(typesRes.data)
            if (specsRes.data) setSpecialties(specsRes.data)

        } else {
            toast.error(res.message || 'Error al cargar transmittal')
        }
        setIsLoading(false)
    }, [id])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Process the ZIP and Excel files
    const processPackage = useCallback(async () => {
        if (!transmittal || (!transmittal.package_url && !transmittal.manifest_url)) return

        setIsProcessing(true)
        try {
            const files: UnzippedFile[] = []

            // 1. Unzip Package
            if (transmittal.package_url) {
                toast.info('Descargando y extrayendo paquete ZIP...')
                const response = await fetch(transmittal.package_url)
                const blob = await response.blob()
                const zip = await JSZip.loadAsync(blob)
                setZipInstance(zip)

                zip.forEach((relativePath, file) => {
                    if (!file.dir) {
                        files.push({
                            name: relativePath.split('/').pop() || '',
                            size: (file as any)._data.uncompressedSize || 0,
                            type: relativePath.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
                            relative_path: relativePath
                        })
                    }
                })
                setZipFiles(files)
            }

            // 2. Parse Manifest Excel
            if (transmittal.manifest_url) {
                toast.info('Procesando manifiesto Excel...')
                const response = await fetch(transmittal.manifest_url)
                const arrayBuffer = await response.arrayBuffer()
                const workbook = XLSX.read(arrayBuffer, { type: 'array' })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(firstSheet)
                setManifestData(jsonData)

                // 3. Simple matching logic (Can be improved)
                // Mock logic: looking for "Código", "Título", "Revisión", "Archivo"
                const mapped: ManifestItem[] = jsonData.map((row: any) => {
                    const filename = row.Archivo || row.Filename || row.Name || ''
                    const zipMatch = files.find(f => f.name.toLowerCase() === filename.toLowerCase())

                    return {
                        code: row.Código || row.Code || 'DOC-' + Math.random().toString(36).substring(7),
                        title: row.Título || row.Title || 'Documento sin título',
                        revision: String(row.Revisión || row.Revision || '0'),
                        filename: filename,
                        document_type_id: '',
                        specialty_id: '',
                        status: zipMatch ? 'MATCHED' : 'MISSING_FILE'
                    }
                })
                setBreakdownItems(mapped)
            } else if (files.length > 0) {
                // If no manifest, list zip files as potential docs
                const mapped: ManifestItem[] = files.map(f => ({
                    code: f.name.replace(/\.[^/.]+$/, ""), // file name without ext
                    title: f.name,
                    revision: '0',
                    filename: f.name,
                    document_type_id: '',
                    specialty_id: '',
                    status: 'MATCHED'
                }))
                setBreakdownItems(mapped)
            }

            toast.success('Paquete procesado. Revisa el desglose.')
        } catch (error: any) {
            console.error(error)
            toast.error('Error al procesar archivos: ' + error.message)
        } finally {
            setIsProcessing(false)
        }
    }, [transmittal])

    const handleCommit = async () => {
        if (!transmittal || !zipInstance) return

        const validItems = breakdownItems.filter(i =>
            i.status === 'MATCHED' &&
            i.document_type_id &&
            i.specialty_id &&
            i.code
        )

        if (validItems.length === 0) {
            toast.error('No hay ítems válidos para importar. Asegúrate de asignar Tipo y Especialidad.')
            return
        }

        setIsProcessing(true)
        toast.info(`Iniciando importación de ${validItems.length} documentos...`)

        try {
            const supabase = createClient()
            const importPayload = []

            for (const item of validItems) {
                // 1. Extract file from ZIP
                const fileEntry = zipInstance.file(item.filename)
                if (!fileEntry) continue

                const blob = await fileEntry.async('blob')
                const fileName = item.filename
                const filePath = `revisions/INCOMING/${transmittal.transmittal_code}/${fileName}`

                // 2. Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, blob, { upsert: true })

                if (uploadError) throw uploadError

                // 3. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath)

                importPayload.push({
                    ...item,
                    file_url: publicUrl,
                    file_size: blob.size,
                    file_hash: 'SHA' + Math.random().toString(16).substring(2, 10), // TODO: Real hash if needed
                })
            }

            // 4. Call Import API
            const response = await fetch(`/api/documents/transmittals/${id}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: importPayload })
            })

            const result = await response.json()

            if (result.success) {
                toast.success(result.message || 'Importación completada con éxito.')
                router.push(`/admin/documents/transmittals/${id}`)
            } else {
                toast.error(result.message || 'Error en la importación masiva.')
            }

        } catch (error: any) {
            console.error(error)
            toast.error('Error durante el proceso: ' + error.message)
        } finally {
            setIsProcessing(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-blue-400" size={40} />
            </div>
        )
    }

    if (!transmittal) return null

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href={`/admin/documents/transmittals/${id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-2"
                    >
                        <ChevronLeft size={16} />
                        Volver a {transmittal.transmittal_code}
                    </Link>
                    <Heading level={1} className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <PackageOpen className="text-amber-500" />
                        Desglose de Paquete
                    </Heading>
                    <Text className="text-slate-400">Analizando el contenido de {transmittal.transmittal_code}</Text>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={processPackage}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} className="text-blue-400" />}
                        Analizar Paquete
                    </button>
                    {breakdownItems.length > 0 && (
                        <button
                            onClick={handleCommit}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Save size={18} />
                            Confirmar e Importar
                        </button>
                    )}
                </div>
            </div>

            {/* Content Split: ZIP content vs Manifest Mapping */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Files in ZIP */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-[#1e293b]/80 border border-white/5 rounded-2xl p-6 shadow-xl h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <List size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Archivos en ZIP</span>
                            </div>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{zipFiles.length} detectados</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[600px] custom-scrollbar pr-2">
                            {zipFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-600 border border-dashed border-white/5 rounded-xl">
                                    <FileText size={32} />
                                    <Text className="text-xs mt-2">Usa "Analizar Paquete" para listar</Text>
                                </div>
                            ) : (
                                zipFiles.map((file, i) => (
                                    <div key={i} className="p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-500/10 rounded text-blue-400">
                                            <FileText size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-white font-medium truncate">{file.name}</div>
                                            <div className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Breakdown Logic */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#1e293b]/80 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Table size={18} className="text-amber-400" />
                                <Heading level={3} className="text-lg font-bold text-white">Mapeo de Documentos</Heading>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    {breakdownItems.filter(i => i.status === 'MATCHED').length} Listos
                                </div>
                                <div className="flex items-center gap-1.5 text-red-400">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    {breakdownItems.filter(i => i.status === 'MISSING_FILE').length} Falta Archivo
                                </div>
                            </div>
                        </div>

                        {breakdownItems.length === 0 ? (
                            <div className="py-32 text-center text-slate-500 flex flex-col items-center gap-4">
                                <Table size={48} className="opacity-10" />
                                <Text>Analiza el paquete para generar el mapeo de documentos.</Text>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#0f172a]/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4">Código / Identificación</th>
                                        <th className="px-6 py-4">Título Documento</th>
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4">Especialidad</th>
                                        <th className="px-6 py-4">Rev</th>
                                        <th className="px-6 py-4">Archivo</th>
                                        <th className="px-6 py-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {breakdownItems.map((item, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={item.code}
                                                    onChange={e => {
                                                        const newItems = [...breakdownItems]
                                                        newItems[i].code = e.target.value
                                                        setBreakdownItems(newItems)
                                                    }}
                                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-blue-300 font-mono focus:ring-1 focus:ring-blue-500/50 outline-none w-full"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={e => {
                                                        const newItems = [...breakdownItems]
                                                        newItems[i].title = e.target.value
                                                        setBreakdownItems(newItems)
                                                    }}
                                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none w-full"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.document_type_id}
                                                    onChange={e => {
                                                        const newItems = [...breakdownItems]
                                                        newItems[i].document_type_id = e.target.value
                                                        setBreakdownItems(newItems)
                                                    }}
                                                    className="bg-black/20 border border-white/10 rounded px-1 py-1 text-[10px] text-slate-300 outline-none w-full"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {docTypes.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.specialty_id}
                                                    onChange={e => {
                                                        const newItems = [...breakdownItems]
                                                        newItems[i].specialty_id = e.target.value
                                                        setBreakdownItems(newItems)
                                                    }}
                                                    className="bg-black/20 border border-white/10 rounded px-1 py-1 text-[10px] text-slate-300 outline-none w-full"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {specialties.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs border border-white/5">
                                                    {item.revision}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={item.filename}>{item.filename}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'MATCHED' ? (
                                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                                    ) : (
                                                        <AlertCircle size={16} className="text-red-500" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Specialty Specific Card: Piping Intelligence */}
                    {breakdownItems.length > 0 && (
                        <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Play size={20} />
                                </div>
                                <div>
                                    <Heading level={4} className="text-white font-bold">Inteligencia de Piping Detectada</Heading>
                                    <Text className="text-xs text-slate-400">Se detectaron {breakdownItems.filter(i => i.code.includes('ISO') || i.filename.toLowerCase().includes('iso')).length} potenciales Isométricos.</Text>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-slate-300">
                                    Al procesar, los archivos que coincidan con el patrón de Isométricos actualizarán automáticamente el registro técnico de Piping y habilitarán el seguimiento de Spools.
                                </div>
                                <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all">
                                    Configurar Reglas
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
