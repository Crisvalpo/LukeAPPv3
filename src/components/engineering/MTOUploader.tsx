/**
 * MTO Uploader Component
 * Handles Excel upload for Material Take-Off data
 * Matches DetailUploader pattern for consistency
 */

'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { uploadMTO, getMTOCount, deleteMTO, parseMTOFromArray } from '@/services/mto'
import { Upload, FileSpreadsheet, CheckCircle2, Trash2, RefreshCcw, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadMTOTemplate } from '@/lib/utils/template-generator'

interface Props {
    revisionId: string
    projectId: string
    companyId: string
}

export default function MTOUploader({ revisionId, projectId, companyId }: Props) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [mtoCount, setMTOCount] = useState<number>(0)
    const [previewCount, setPreviewCount] = useState(0)

    useEffect(() => {
        loadMTOCount()
    }, [revisionId])

    async function loadMTOCount() {
        try {
            const count = await getMTOCount(revisionId)
            setMTOCount(count)
        } catch (err) {
            console.error('Error loading MTO count:', err)
        }
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setError(null)
            setSuccess(false)

            // Preview count
            const reader = new FileReader()
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary' })
                    const ws = wb.Sheets[wb.SheetNames[0]]
                    const data = XLSX.utils.sheet_to_json(ws)
                    setPreviewCount(data.length)
                } catch (err) {
                    console.error('Error parsing file', err)
                }
            }
            reader.readAsBinaryString(selectedFile)
        }
    }

    async function handleUpload() {
        if (!file) {
            setError('Por favor selecciona un archivo Excel')
            return
        }

        setUploading(true)
        setError(null)
        setSuccess(false)

        try {
            // Read Excel file
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data, { type: 'array' })

            // Get first sheet
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]

            // Convert to array of arrays
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            // Parse MTO data
            const mtoRows = parseMTOFromArray(rawData)

            if (mtoRows.length === 0) {
                throw new Error('No se encontraron datos válidos en el Excel')
            }

            // Upload to database
            await uploadMTO(revisionId, projectId, companyId, mtoRows)

            setSuccess(true)
            setFile(null)
            setPreviewCount(0)

            // Reload count
            await loadMTOCount()

        } catch (err) {
            console.error('Error uploading MTO:', err)
            setError(err instanceof Error ? err.message : 'Error al procesar el archivo')
        } finally {
            setUploading(false)
        }
    }

    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar todos los datos de MTO para esta revisión?')) {
            return
        }

        setUploading(true)
        setError(null)

        try {
            await deleteMTO(revisionId)
            setSuccess(true)
            await loadMTOCount()
        } catch (err) {
            console.error('Error deleting MTO:', err)
            setError(err instanceof Error ? err.message : 'Error al eliminar MTO')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="w-full">
            {!success ? (
                <div className="bg-black/20 border-2 border-dashed border-glass-border/30 rounded-xl p-8 hover:bg-black/30 transition-all group relative">
                    {!file ? (
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-bg-surface-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                <FileSpreadsheet size={32} className="text-brand-primary opacity-80" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Cargar Excel MTO</h3>
                            <p className="text-text-dim text-sm max-w-sm mb-6">
                                Arrastra y suelta tu archivo Excel aquí, o haz clic para seleccionar.
                            </p>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="px-6 py-2.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-lg font-medium group-hover:bg-brand-primary/20 transition-colors pointer-events-none">
                                Seleccionar Archivo
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center justify-center mb-4">
                                <FileSpreadsheet size={32} className="text-status-success" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1 truncate max-w-md">{file.name}</h3>
                            <p className="text-status-success text-sm font-medium mb-6">
                                {previewCount} filas detectadas
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setFile(null)}
                                    disabled={uploading}
                                    className="border-glass-border/50 hover:bg-white/5 text-text-dim hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-2 min-w-[140px]"
                                >
                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {uploading ? 'Procesando...' : 'Cargar MTO'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-status-success/5 border border-status-success/20 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-status-success/20 flex items-center justify-center mb-3 text-status-success border border-status-success/20 shadow-lg shadow-status-success/5">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">¡Carga Exitosa!</h3>
                        <p className="text-text-dim text-sm">
                            Se han procesado correctamente los datos del MTO.
                        </p>
                    </div>

                    {mtoCount > 0 && (
                        <div className="grid grid-cols-1 gap-4 mb-6 max-w-xs mx-auto">
                            <div className="bg-black/20 border border-glass-border/30 rounded-lg p-4 flex items-center justify-between">
                                <span className="text-text-dim text-sm">Registros MTO</span>
                                <span className="text-xl font-bold text-white">{mtoCount.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center gap-3">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={uploading}
                            className="bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/20"
                        >
                            <Trash2 size={16} className="mr-2" /> Eliminar MTO
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { setFile(null); setSuccess(false); }}
                            className="border-glass-border/50 hover:bg-white/5 text-text-dim hover:text-white"
                        >
                            <RefreshCcw size={16} className="mr-2" /> Cargar otro archivo
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-status-error shrink-0 mt-0.5" size={18} />
                    <div className="text-status-error/90 font-medium">
                        {error}
                    </div>
                </div>
            )}
        </div>
    )
}
