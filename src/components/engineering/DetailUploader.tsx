/**
 * DETAIL UPLOADER - WELDS-FIRST PATTERN
 * 
 * Simpler uploader supporting only Welds upload.
 * Shows auto-spooling status and impact evaluation warnings.
 */

'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Flame, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadSpoolsWelds, type SpoolWeldRow, type UploadWeldsResult } from '@/services/engineering-details'

interface Props {
    revisionId: string
    projectId: string
    companyId: string
    onSuccess?: () => void
}

export default function DetailUploader({
    revisionId,
    projectId,
    companyId,
    onSuccess
}: Props) {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<UploadWeldsResult | null>(null)
    const [previewCount, setPreviewCount] = useState(0)

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0]
            setFile(f)
            setResult(null)

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
            reader.readAsBinaryString(f)
        }
    }

    async function handleUpload() {
        if (!file) return
        setIsUploading(true)

        try {
            const data = await new Promise<SpoolWeldRow[]>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const bstr = e.target?.result
                        const wb = XLSX.read(bstr, { type: 'binary' })
                        const ws = wb.Sheets[wb.SheetNames[0]]
                        resolve(XLSX.utils.sheet_to_json(ws))
                    } catch (err) { reject(err) }
                }
                reader.readAsBinaryString(file)
            })

            const res = await uploadSpoolsWelds(
                revisionId,
                projectId,
                companyId,
                data
            )

            setResult(res)
            if (res.success && onSuccess) onSuccess()

        } catch (error: any) {
            alert('Error en carga: ' + error.message)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="w-full">
            {!result ? (
                <div className="bg-black/20 border-2 border-dashed border-glass-border/30 rounded-xl p-8 hover:bg-black/30 transition-all group relative">
                    {!file ? (
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner border border-brand-primary/30">
                                <Flame size={32} className="text-brand-primary opacity-80" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Cargar Mapa de Uniones</h3>
                            <p className="text-text-dim text-sm max-w-sm mb-6">
                                Arrastra y suelta tu archivo Excel (Welds) aquí, o haz clic para seleccionar.
                            </p>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="px-6 py-2.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-lg font-medium group-hover:bg-brand-primary/20 transition-colors pointer-events-none">
                                Seleccionar Excel
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
                                    disabled={isUploading}
                                    className="border-glass-border/50 hover:bg-white/5 text-text-dim hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-2 min-w-[140px]"
                                >
                                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {isUploading ? 'Procesando...' : 'Iniciar Carga'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`border rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${result.success
                    ? 'bg-status-success/5 border-status-success/20'
                    : 'bg-status-warning/5 border-status-warning/20'
                    }`}>
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border shadow-lg ${result.success
                            ? 'bg-status-success/20 text-status-success border-status-success/20 shadow-status-success/5'
                            : 'bg-status-warning/20 text-status-warning border-status-warning/20 shadow-status-warning/5'
                            }`}>
                            {result.success ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">
                            {result.success ? '¡Carga Exitosa!' : 'Carga con Observaciones'}
                        </h3>
                        {result.message && (
                            <p className="text-text-dim text-sm max-w-md">
                                {result.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
                        <div className="bg-black/20 border border-glass-border/30 rounded-lg p-4 flex flex-col items-center">
                            <span className="text-text-dim text-xs uppercase tracking-wider mb-1">Uniones</span>
                            <span className="text-2xl font-bold text-white">{result.details.welds_inserted}</span>
                        </div>
                        <div className="bg-black/20 border border-glass-border/30 rounded-lg p-4 flex flex-col items-center">
                            <span className="text-text-dim text-xs uppercase tracking-wider mb-1">Spools</span>
                            <span className="text-2xl font-bold text-white">{result.details.spools_detected}</span>
                        </div>
                    </div>

                    {result.was_auto_spooled && (
                        <div className="mb-4 p-4 bg-status-success/10 border border-status-success/20 rounded-xl flex items-start gap-3 text-sm">
                            <CheckCircle2 className="text-status-success shrink-0 mt-0.5" size={18} />
                            <div>
                                <strong className="text-status-success block mb-0.5">Revisión marcada como VIGENTE</strong>
                                <p className="text-status-success/80">Esta es la primera revisión cargada, por lo que fue marcada lista para fabricación.</p>
                            </div>
                        </div>
                    )}

                    {result.requires_impact_evaluation && (
                        <div className="mb-4 p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl flex items-start gap-3 text-sm">
                            <AlertTriangle className="text-status-warning shrink-0 mt-0.5" size={18} />
                            <div>
                                <strong className="text-status-warning block mb-0.5">REQUIERE EVALUACIÓN DE IMPACTOS</strong>
                                <p className="text-status-warning/80">Ya existe una revisión anterior. Debes verificar los impactos en spools fabricados.</p>
                            </div>
                        </div>
                    )}

                    {result.errors && result.errors.length > 0 && (
                        <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-xl text-sm">
                            <h5 className="font-semibold text-status-error mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} /> Errores detectados:
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-status-error/90 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {result.errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            onClick={() => { setFile(null); setResult(null); }}
                            className="border-glass-border/50 hover:bg-white/5 text-text-dim hover:text-white"
                        >
                            Cargar otro archivo
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
