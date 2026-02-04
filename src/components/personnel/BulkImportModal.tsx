'use client'

import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle, FileSpreadsheet, Download, Users } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import '@/styles/views/personnel.css' // Ensure CSS is imported (or rely on parent import)

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

    const downloadTemplate = async () => {
        const { downloadPersonnelTemplate } = await import('@/utils/excel-templates')
        downloadPersonnelTemplate()
    }

    const handleImport = async () => {
        setStep('importing')
        try {
            const workers = parsedData.map((row: any) => {
                // Normalize keys
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
                    turno: normalizedRow['TURNO'] // DIA or NOCHE
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

            if (data.success) {
                // Optional: trigger onSuccess immediately or wait for close
            }
        } catch (error) {
            console.error('Error importing:', error)
            setImportResult({ error: 'Error de conexión al importar' })
            setStep('result')
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header">
                    <h3 className="modal-title">
                        <Users size={20} style={{ color: 'var(--blue-500)' }} />
                        Carga Masiva de Personal
                    </h3>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-body">

                    {step === 'upload' && (
                        <div className="space-y-6 text-center">
                            <div className="max-w-md mx-auto mb-6">
                                <p className="text-secondary text-sm">
                                    Sube un archivo Excel o CSV con la lista de trabajadores para el proyecto actual.
                                </p>
                            </div>

                            <div
                                className="upload-area group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={48} className="mx-auto mb-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                <p className="text-primary font-medium" style={{ color: 'white' }}>Click para seleccionar archivo</p>
                                <p className="text-xs text-secondary mt-2" style={{ color: '#94a3b8' }}>Soporta archivos .xlsx, .xls o .csv</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            <div className="instructions-box">
                                <h4 className="instructions-title">
                                    <AlertCircle size={16} />
                                    Requisitos de Columnas
                                </h4>
                                <p className="instructions-text">
                                    El archivo debe contener las siguientes columnas (el orden no importa):
                                    <br /><br />
                                    <strong>Obligatorias:</strong> <code>RUT</code>, <code>NOMBRE</code><br />
                                    <strong>Opcionales:</strong> <code>ID_INTERNO</code>, <code>TURNO</code> (DIA/NOCHE), <code>CARGO</code>, <code>EMAIL</code>, <code>TELEFONO</code>, <code>JORNADA</code>
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="font-semibold text-primary">Vista Previa ({parsedData.length} filas)</h4>
                                <button
                                    onClick={() => setStep('upload')}
                                    className="btn-link"
                                >
                                    Cambiar archivo
                                </button>
                            </div>
                            <div className="personnel-table-container max-h-60 overflow-y-auto">
                                <table className="personnel-table">
                                    <thead>
                                        <tr>
                                            {parsedData.length > 0 && Object.keys(parsedData[0]).slice(0, 5).map((header) => (
                                                <th key={header}>{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.slice(0, 10).map((row, idx) => (
                                            <tr key={idx} className="personnel-row">
                                                {Object.values(row).slice(0, 5).map((val: any, i) => (
                                                    <td key={i} className="truncate max-w-[150px]">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-secondary text-lg">Procesando datos...</p>
                        </div>
                    )}

                    {step === 'result' && importResult && (
                        <div className="text-center py-4">
                            {importResult.success ? (
                                <div className="mb-6 fade-in">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">¡Importación Exitosa!</h4>
                                    <div className="flex justify-center gap-4 text-sm mt-4">
                                        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                                            <span className="block text-2xl font-bold text-green-400">{importResult.details.imported}</span>
                                            <span className="text-slate-400">Importados</span>
                                        </div>
                                        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                                            <span className="block text-2xl font-bold text-amber-400">{importResult.details.skipped}</span>
                                            <span className="text-slate-400">Omitidos</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Error en Importación</h4>
                                    <p className="text-error bg-red-500/10 px-4 py-2 rounded-lg inline-block border border-red-500/20">
                                        {importResult.error}
                                    </p>
                                </div>
                            )}

                            {importResult.details?.errors && importResult.details.errors.length > 0 && (
                                <div className="mt-6 text-left bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                                    <div className="px-4 py-2 bg-slate-950 border-b border-slate-700">
                                        <h5 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Detalle de Errores ({importResult.details.errors.length})</h5>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto p-2">
                                        {importResult.details.errors.map((err: any, idx: number) => (
                                            <div key={idx} className="flex gap-2 text-xs py-1.5 border-b border-slate-800/50 last:border-0 px-2 hover:bg-slate-700/30 rounded">
                                                <span className="font-mono text-amber-400 w-24 shrink-0">{err.rut}</span>
                                                <span className="text-secondary">{err.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Footer */}
                <div className="modal-footer">
                    {step === 'result' ? (
                        <button
                            onClick={() => {
                                onClose()
                                if (importResult.success) onSuccess()
                            }}
                            className="btn-primary"
                        >
                            Finalizar
                        </button>
                    ) : (
                        <>
                            {step === 'preview' && (
                                <button
                                    onClick={handleImport}
                                    className="btn-primary"
                                >
                                    <Upload size={16} />
                                    Importar {parsedData.length} Personas
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
