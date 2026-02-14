/**
 * PREMIUM REVISION ANNOUNCEMENT TAB
 * 
 * Upload interface for revision announcements with:
 * - Drag & drop file upload
 * - Real-time Excel preview
 * - Client-side validation
 * - Progress tracking
 * - Beautiful results display
 * - Error reporting with row numbers
 */

'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { downloadAnnouncementTemplate } from '@/lib/utils/template-generator'
import {
    processAnnouncementUpload,
    validateAnnouncementData,
    type AnnouncementResult
} from '@/services/revision-announcements'
import { Megaphone, Download, Upload, FileText, X, AlertTriangle, CheckCircle2, UploadCloud, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/Typography'
// Styles migrated to Tailwind v4

interface Props {
    projectId: string
    companyId: string
    onSuccess?: () => void
}

export default function RevisionAnnouncementTab({
    projectId,
    companyId,
    onSuccess
}: Props) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<any[] | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<AnnouncementResult | null>(null)
    const [validationErrors, setValidationErrors] = useState<any[]>([])

    // Handle file selection
    async function handleFileSelect(selectedFile: File) {
        setFile(selectedFile)
        setResult(null)
        setValidationErrors([])

        // Parse and preview Excel
        try {
            const rawData = await parseExcelFile(selectedFile)

            // Format dates for preview
            const previewData = rawData.slice(0, 10).map(row => {
                const newRow = { ...row }
                // Check common date columns
                const dateKeys = ['FECHA', 'DATE', 'Fecha', 'Date']

                dateKeys.forEach(key => {
                    if (key in newRow) {
                        const val = newRow[key]
                        // If it's a number looking like an Excel date (roughly > 40000 for recent years)
                        if (typeof val === 'number' && val > 30000 && val < 60000) {
                            try {
                                const excelEpoch = new Date(1899, 11, 30);
                                const date = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
                                newRow[key] = date.toLocaleDateString('es-CL')
                            } catch (e) {
                                // Keep original if fail
                            }
                        }
                    }
                })
                return newRow
            })

            setPreview(previewData)

            // Validate (using raw data to ensure backend logic is what validates)
            const validation = validateAnnouncementData(rawData)
            if (!validation.isValid) {
                setValidationErrors(validation.errors)
            }
        } catch (error: any) {
            alert(`Error leyendo archivo: ${error.message}`)
            setFile(null)
        }
    }

    // Parse Excel file
    async function parseExcelFile(file: File): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: 'binary' })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    const jsonData = XLSX.utils.sheet_to_json(worksheet)
                    resolve(jsonData)
                } catch (error) {
                    reject(error)
                }
            }

            reader.onerror = () => reject(new Error('Error leyendo archivo'))
            reader.readAsBinaryString(file)
        })
    }

    // Handle upload
    async function handleUpload() {
        if (!file || validationErrors.length > 0) return

        setIsUploading(true)

        try {
            const data = await parseExcelFile(file)
            const uploadResult = await processAnnouncementUpload(
                projectId,
                companyId,
                data
            )

            setResult(uploadResult)

            if (uploadResult.success && onSuccess) {
                onSuccess()
            }
        } catch (error: any) {
            alert(`Error procesando archivo: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    // Reset state
    function handleReset() {
        setFile(null)
        setPreview(null)
        setResult(null)
        setValidationErrors([])
    }

    return (
        <div className="w-full space-y-6">
            <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary border border-brand-secondary/20 shadow-lg shadow-brand-secondary/5">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <Heading title="Anuncio de Ingeniería" size="lg" className="mb-1" />
                            <p className="text-text-dim text-sm">
                                Carga el Excel con isométricos y sus revisiones para iniciar el flujo de ingeniería.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={downloadAnnouncementTemplate}
                        className="gap-2 text-brand-secondary hover:text-brand-secondary hover:bg-brand-secondary/10 border border-brand-secondary/20"
                    >
                        <Download size={16} /> Descargar Plantilla
                    </Button>
                </div>

                {!file && !result && (
                    <div className="border-2 border-dashed border-glass-border/50 rounded-2xl p-10 flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 transition-colors cursor-pointer group relative overflow-hidden">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                                if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                            }}
                        />
                        <div className="w-20 h-20 rounded-full bg-bg-surface-2/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-glass-border">
                            <Upload className="text-brand-primary w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Arrastra tu archivo Excel aquí</h3>
                        <p className="text-text-dim text-sm mb-6">o haz clic para seleccionar</p>
                        <div className="px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium border border-brand-primary/20">
                            Soporta .xlsx, .xls
                        </div>
                    </div>
                )}

                {file && !result && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <FilePreview
                            file={file}
                            preview={preview}
                            validationErrors={validationErrors}
                            onRemove={handleReset}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-glass-border/30">
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                disabled={isUploading}
                                className="hover:bg-status-error/10 hover:text-status-error"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || validationErrors.length > 0}
                                className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-2 min-w-[160px]"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Procesando...
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={18} /> Importar Anuncio
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {result && (
                    <ResultsDisplay
                        result={result}
                        onReset={handleReset}
                    />
                )}
            </div>
        </div>
    )
}

/**
 * File Drop Zone Component
 */

/**
 * File Preview Component
 */
function FilePreview({
    file,
    preview,
    validationErrors,
    onRemove
}: {
    file: File
    preview: any[] | null
    validationErrors: any[]
    onRemove: () => void
}) {
    return (
        <div className="bg-black/20 rounded-xl border border-glass-border/50 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-glass-border/30 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="font-medium text-white text-sm">{file.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-text-dim mt-0.5">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">{formatFileSize(file.size)}</span>
                            {preview && <span>• {preview.length}+ filas detectadas</span>}
                        </div>
                    </div>
                </div>
                <button
                    className="p-2 hover:bg-status-error/20 hover:text-status-error text-text-dim rounded-lg transition-colors"
                    onClick={onRemove}
                >
                    <X size={18} />
                </button>
            </div>

            {validationErrors.length > 0 && (
                <div className="p-4 bg-status-error/10 border-b border-status-error/20">
                    <div className="flex items-center gap-2 text-status-error font-semibold mb-2 text-sm">
                        <AlertTriangle size={16} /> Errores de Validación
                    </div>
                    <ul className="space-y-1.5 mb-2">
                        {validationErrors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-xs text-status-error/90 flex gap-2">
                                <span className="font-mono bg-status-error/20 px-1 rounded h-fit">Fila {error.row}</span>
                                <span>{error.message}</span>
                            </li>
                        ))}
                    </ul>
                    {validationErrors.length > 5 && (
                        <p className="text-xs text-status-error/70 italic">
                            y {validationErrors.length - 5} errores más...
                        </p>
                    )}
                </div>
            )}

            {preview && validationErrors.length === 0 && (
                <div className="p-0 overflow-x-auto">
                    <div className="px-4 py-2 bg-emerald-900/10 border-b border-emerald-500/10 text-emerald-400 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 size={12} /> Vista Previa (primeras 10 filas)
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-white/5 text-text-dim uppercase tracking-wider font-semibold">
                            <tr>
                                {Object.keys(preview[0] || {}).map(key => (
                                    <th key={key} className="px-4 py-2.5 border-b border-glass-border/30 whitespace-nowrap min-w-[100px]">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/30 text-white/80">
                            {preview.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="px-4 py-2 whitespace-nowrap">{String(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

/**
 * Results Display Component
 */
function ResultsDisplay({
    result,
    onReset
}: {
    result: AnnouncementResult
    onReset: () => void
}) {
    const isSuccess = result.success;

    return (
        <div className="space-y-6">
            <div className={`rounded-xl p-6 border ${isSuccess ? 'bg-status-success/10 border-status-success/30' : 'bg-status-error/10 border-status-error/30'} flex gap-4 items-start`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? 'bg-status-success/20 text-status-success' : 'bg-status-error/20 text-status-error'}`}>
                    {isSuccess ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                    <h3 className={`text-lg font-bold mb-1 ${isSuccess ? 'text-status-success' : 'text-status-error'}`}>
                        {result.success ? 'Importación Exitosa' : 'Importación con Errores'}
                    </h3>
                    <p className="text-white/80 text-sm">
                        {result.success
                            ? 'Los anuncios de revisión fueron procesados correctamente. Se han generado las tareas correspondientes.'
                            : 'Se encontraron errores durante la importación. Por favor revisa los detalles abajo.'
                        }
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black/20 border border-glass-border/30 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-text-dim text-xs uppercase font-bold tracking-wider mb-1">Total Procesadas</span>
                    <span className="text-2xl font-bold text-white">{result.summary.total}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-emerald-400 text-xs uppercase font-bold tracking-wider mb-1">Isométricos</span>
                    <span className="text-2xl font-bold text-emerald-400">{result.summary.isometricsCreated}</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-blue-400 text-xs uppercase font-bold tracking-wider mb-1">Revisiones</span>
                    <span className="text-2xl font-bold text-blue-400">{result.summary.revisionsCreated}</span>
                </div>
                <div className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center ${result.summary.errors > 0 ? 'bg-status-error/10 border-status-error/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                    <span className={`${result.summary.errors > 0 ? 'text-status-error' : 'text-orange-400'} text-xs uppercase font-bold tracking-wider mb-1`}>
                        {result.summary.errors > 0 ? 'Errores' : 'Omitidos'}
                    </span>
                    <span className={`text-2xl font-bold ${result.summary.errors > 0 ? 'text-status-error' : 'text-orange-400'}`}>
                        {result.summary.errors > 0 ? result.summary.errors : result.summary.revisionsSkipped}
                    </span>
                </div>
            </div>

            {result.details.length > 0 && (
                <div className="bg-black/20 border border-glass-border/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-glass-border/30 bg-white/5 font-semibold text-white flex items-center gap-2">
                        <FileText size={16} /> Detalles del Proceso
                    </div>
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-glass-border/20 p-2">
                        {result.details.slice(0, 50).map((detail, i) => (
                            <div key={i} className={`flex items-start gap-3 p-2 text-sm rounded hover:bg-white/5 transition-colors ${detail.action === 'error' ? 'bg-status-error/5' : ''
                                }`}>
                                <span className="mt-0.5 shrink-0">
                                    {detail.action === 'created' && <span className="text-emerald-400 font-mono text-xs px-1.5 py-0.5 bg-emerald-400/10 rounded">NUEVO</span>}
                                    {detail.action === 'updated' && <span className="text-blue-400 font-mono text-xs px-1.5 py-0.5 bg-blue-400/10 rounded">ACT</span>}
                                    {detail.action === 'skipped' && <span className="text-orange-400 font-mono text-xs px-1.5 py-0.5 bg-orange-400/10 rounded">OMIT</span>}
                                    {detail.action === 'error' && <span className="text-status-error font-mono text-xs px-1.5 py-0.5 bg-status-error/10 rounded">ERROR</span>}
                                </span>
                                <span className="text-text-dim">{detail.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <Button onClick={onReset} className="gap-2 bg-brand-primary text-white hover:bg-brand-primary/90">
                    <RefreshCw size={16} /> Importar Otro Archivo
                </Button>
            </div>
        </div>
    )
}

// Utility functions
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
