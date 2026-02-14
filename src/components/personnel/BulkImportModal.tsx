import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle, FileSpreadsheet, Download, Users, ArrowRight, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ImportCSVModalProps {
    projectId: string
    onClose: () => void
    onSuccess: () => void
}

export default function BulkImportModal({ projectId, onClose, onSuccess }: ImportCSVModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<any[]>([])
    const [importResult, setImportResult] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            if (selectedFile.name.endsWith('.csv')) {
                parseCSV(selectedFile)
            } else {
                parseExcel(selectedFile)
            }
        }
    }

    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setParsedData(results.data)
                setStep('preview')
            },
            error: (error) => {
                console.error('Error parsing CSV:', error)
                alert('Error al leer el archivo CSV')
            }
        })
    }

    const parseExcel = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(sheet)
                setParsedData(jsonData)
                setStep('preview')
            } catch (error) {
                console.error('Error parsing Excel:', error)
                alert('Error al leer el archivo Excel')
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        setStep('importing')
        try {
            const workers = parsedData.map((row: any) => {
                const normalizedRow: any = {}
                Object.keys(row).forEach(key => {
                    normalizedRow[key.toUpperCase().trim()] = row[key]
                })

                return {
                    rut: normalizedRow['RUT'] || normalizedRow['RUT_TRABAJADOR'],
                    internal_id: normalizedRow['ID_INTERNO'] || normalizedRow['ID'] || normalizedRow['FICHA'],
                    nombre: normalizedRow['NOMBRE'] || normalizedRow['NOMBRES'] || normalizedRow['NOMBRE_COMPLETO'],
                    email: normalizedRow['EMAIL'] || normalizedRow['CORREO'],
                    telefono: normalizedRow['TELEFONO'] || normalizedRow['CELULAR'],
                    cargo: normalizedRow['CARGO'] || normalizedRow['ROL'],
                    jornada: normalizedRow['JORNADA'] || normalizedRow['TURNO_JORNADA'],
                    turno: normalizedRow['TURNO']
                }
            }).filter(w => w.rut && w.nombre)

            const res = await fetch('/api/personnel/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workers,
                    projectId: projectId
                })
            })

            const data = await res.json()
            setImportResult(data)
            setStep('result')
        } catch (error) {
            console.error('Error importing:', error)
            setImportResult({ error: 'Error de conexión al importar' })
            setStep('result')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="relative w-full max-w-2xl bg-bg-surface-1 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={2} className="text-xl font-bold text-white">Carga Masiva de Personal</Heading>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-dim hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    {step === 'upload' && (
                        <div className="space-y-8">
                            <Text className="text-text-muted text-center max-w-md mx-auto">
                                Sube un archivo Excel o CSV con la lista de trabajadores para el proyecto actual.
                            </Text>

                            <div
                                className="group relative cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                                <div className="relative border-2 border-dashed border-white/10 group-hover:border-blue-500/50 rounded-2xl p-12 text-center transition-all duration-300 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-text-dim group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300">
                                        <Upload size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white font-bold text-lg">Haga clic para seleccionar archivo</p>
                                        <p className="text-text-dim text-sm">Soporta archivos .xlsx, .xls o .csv</p>
                                    </div>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                            />

                            <div className="bg-bg-surface-2/50 border border-white/5 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <AlertCircle size={18} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Requisitos de Columnas</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <p className="text-white font-medium">Obligatorias:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-300">RUT</Badge>
                                            <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-300">NOMBRE</Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-text-dim font-medium">Opcionales:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="bg-white/5 border-white/5 text-text-muted">ID_INTERNO</Badge>
                                            <Badge variant="secondary" className="bg-white/5 border-white/5 text-text-muted">TURNO</Badge>
                                            <Badge variant="secondary" className="bg-white/5 border-white/5 text-text-muted">CARGO</Badge>
                                            <Badge variant="secondary" className="bg-white/5 border-white/5 text-text-muted">EMAIL</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Heading level={3} className="text-lg font-bold text-white flex items-center gap-2">
                                    Vista Previa
                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none">{parsedData.length} registros</Badge>
                                </Heading>
                                <Button variant="ghost" size="sm" onClick={() => setStep('upload')} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/5">
                                    Cambiar archivo
                                </Button>
                            </div>

                            <div className="relative border border-white/10 rounded-xl overflow-hidden bg-bg-app">
                                <div className="max-h-64 overflow-y-auto overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="sticky top-0 bg-bg-surface-2 z-10 border-b border-white/10">
                                            <tr>
                                                {parsedData.length > 0 && Object.keys(parsedData[0]).slice(0, 5).map((header) => (
                                                    <th key={header} className="px-4 py-3 font-bold text-text-dim uppercase text-[10px] tracking-widest">{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {parsedData.slice(0, 10).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    {Object.values(row).slice(0, 5).map((val: any, i) => (
                                                        <td key={i} className="px-4 py-3 text-text-main truncate max-w-[150px]">{val}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {parsedData.length > 10 && (
                                    <div className="p-2 text-center bg-bg-surface-2/30 border-t border-white/5">
                                        <Text size="xs" className="text-text-dim italic">Mostrando las primeras 10 filas</Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <Heading level={3} className="text-xl font-bold text-white">Procesando Importación</Heading>
                                <Text className="text-text-muted">Estamos validando y registrando la información...</Text>
                            </div>
                        </div>
                    )}

                    {step === 'result' && importResult && (
                        <div className="space-y-8 py-4">
                            {importResult.success ? (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-scale-in">
                                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Heading level={2} className="text-2xl font-bold text-white uppercase tracking-tight">¡Importación Exitosa!</Heading>
                                        <Text className="text-text-muted">El personal ha sido registrado correctamente en el proyecto.</Text>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                        <div className="bg-white/5 border border-emerald-500/20 p-4 rounded-2xl space-y-1">
                                            <span className="block text-3xl font-bold text-emerald-400 leading-none">{importResult.details.imported}</span>
                                            <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Registrados</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1">
                                            <span className="block text-3xl font-bold text-text-dim leading-none">{importResult.details.skipped}</span>
                                            <span className="text-[10px] font-bold text-text-dim/70 uppercase tracking-widest">Omitidos</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                                        <AlertCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Heading level={2} className="text-xl font-bold text-white">Error en Importación</Heading>
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 inline-block">
                                            <Text className="text-red-400 font-medium">{importResult.error}</Text>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {importResult.details?.errors && importResult.details.errors.length > 0 && (
                                <div className="bg-bg-app border border-white/5 rounded-2xl overflow-hidden mt-6 shadow-xl">
                                    <div className="px-5 py-3 bg-bg-surface-2/50 border-b border-white/5">
                                        <Heading level={4} className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Detalle de Anomalías ({importResult.details.errors.length})</Heading>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto p-2 scrollbar-hide">
                                        {importResult.details.errors.map((err: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 items-center p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg">
                                                <Badge variant="outline" className="font-mono text-[10px] bg-red-500/5 text-red-400 border-red-500/10 shrink-0">{err.rut || 'S/N'}</Badge>
                                                <span className="text-xs text-text-muted">{err.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-bg-surface-2/30 border-t border-white/5 flex justify-end items-center gap-4">
                    {step === 'result' ? (
                        <Button
                            onClick={() => {
                                onClose()
                                if (importResult.success) onSuccess()
                            }}
                            className="bg-white text-black hover:bg-slate-200 border-none font-bold min-w-[120px]"
                        >
                            Finalizar
                        </Button>
                    ) : (
                        <>
                            {step === 'upload' && (
                                <Button variant="ghost" onClick={onClose} className="text-text-dim hover:text-white">
                                    Cancelar
                                </Button>
                            )}
                            {step === 'preview' && (
                                <>
                                    <Button variant="ghost" onClick={() => setStep('upload')} className="text-text-dim hover:text-white">
                                        Atrás
                                    </Button>
                                    <Button
                                        onClick={handleImport}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-[0_4px_15px_rgba(99,102,241,0.3)] font-bold min-w-[200px]"
                                    >
                                        <Upload size={18} className="mr-2" />
                                        Confirmar Importación
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
