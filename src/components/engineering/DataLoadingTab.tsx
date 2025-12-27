/**
 * Data Loading Tab Component
 * 
 * UI for uploading Excel files and importing engineering data.
 * Displays in Engineering Hub as "Carga de Datos" tab.
 */

'use client'

import { useState } from 'react'
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'
import { importIsometrics, importSpools, importWelds, type ImportResult } from '@/services/data-import'
import { downloadTemplate, type TemplateType } from '@/lib/utils/template-generator'
import '@/styles/data-loading.css'

interface DataLoadingTabProps {
    projectId: string
}

type EntityType = 'isometrics' | 'spools' | 'welds'

export default function DataLoadingTab({ projectId }: DataLoadingTabProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedType, setSelectedType] = useState<EntityType>('isometrics')
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)

    const entityLabels = {
        isometrics: 'Isométricos',
        spools: 'Spools',
        welds: 'Soldaduras'
    }

    const entityIcons = {
        isometrics: '📋',
        spools: '🔩',
        welds: '⚡'
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setResult(null) // Clear previous results
        }
    }

    const handleUpload = async () => {
        if (!selectedFile || !projectId) return

        setIsUploading(true)
        setResult(null)

        try {
            let uploadResult: ImportResult

            switch (selectedType) {
                case 'isometrics':
                    uploadResult = await importIsometrics(selectedFile, projectId)
                    break
                case 'spools':
                    uploadResult = await importSpools(selectedFile, projectId)
                    break
                case 'welds':
                    uploadResult = await importWelds(selectedFile, projectId)
                    break
            }

            setResult(uploadResult)

            if (uploadResult.success) {
                setSelectedFile(null) // Clear file on success
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            setResult({
                success: false,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, message: error.message || 'Error desconocido' }],
                message: 'Error al subir archivo'
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleDownloadTemplate = (type: TemplateType) => {
        downloadTemplate(type)
    }

    return (
        <div className="data-loading-container">
            <div className="data-loading-header">
                <h2>Carga de Datos de Ingeniería</h2>
                <p>Importa isométricos, spools y soldaduras desde archivos Excel</p>
            </div>

            {/* Entity Type Selector */}
            <div className="entity-selector">
                {(Object.keys(entityLabels) as EntityType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => {
                            setSelectedType(type)
                            setSelectedFile(null)
                            setResult(null)
                        }}
                        className={`entity-button ${selectedType === type ? 'active' : ''}`}
                    >
                        <span className="entity-icon">{entityIcons[type]}</span>
                        <span className="entity-label">{entityLabels[type]}</span>
                    </button>
                ))}
            </div>

            {/* Upload Card */}
            <div className="upload-card">
                <div className="upload-card-header">
                    <h3>{entityIcons[selectedType]} {entityLabels[selectedType]}</h3>
                    <button
                        onClick={() => handleDownloadTemplate(selectedType)}
                        className="download-template-btn"
                    >
                        <Download className="btn-icon" />
                        Descargar Plantilla
                    </button>
                </div>

                {/* File Upload Zone */}
                <div className="file-upload-zone">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="file-input"
                        id="excel-upload"
                    />
                    <label htmlFor="excel-upload" className="file-upload-label">
                        {selectedFile ? (
                            <div className="file-selected">
                                <FileSpreadsheet className="file-icon" />
                                <div className="file-info">
                                    <span className="file-name">{selectedFile.name}</span>
                                    <span className="file-size">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="file-empty">
                                <Upload className="upload-icon" />
                                <span className="upload-text">
                                    Haz clic para seleccionar un archivo Excel
                                </span>
                                <span className="upload-hint">
                                    o arrastra y suelta aquí
                                </span>
                            </div>
                        )}
                    </label>
                </div>

                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="upload-button"
                >
                    {isUploading ? (
                        <>
                            <div className="spinner" />
                            Importando...
                        </>
                    ) : (
                        <>
                            <Upload className="btn-icon" />
                            Importar Datos
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className={`result-card ${result.success ? 'success' : 'error'}`}>
                    <div className="result-header">
                        {result.success ? (
                            <CheckCircle className="result-icon success-icon" />
                        ) : (
                            <AlertCircle className="result-icon error-icon" />
                        )}
                        <h3>{result.message}</h3>
                    </div>

                    <div className="result-stats">
                        <div className="stat">
                            <span className="stat-label">Importados:</span>
                            <span className="stat-value success">{result.imported}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Omitidos:</span>
                            <span className="stat-value warning">{result.skipped}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Errores:</span>
                            <span className="stat-value error">{result.errors.length}</span>
                        </div>
                    </div>

                    {/* Error List */}
                    {result.errors.length > 0 && (
                        <div className="error-list">
                            <h4>Detalle de Errores ({result.errors.length}):</h4>
                            <div className="error-items">
                                {result.errors.slice(0, 10).map((error, index) => (
                                    <div key={index} className="error-item">
                                        <span className="error-row">Fila {error.row}:</span>
                                        <span className="error-message">
                                            {error.field && `${error.field} - `}
                                            {error.message}
                                        </span>
                                    </div>
                                ))}
                                {result.errors.length > 10 && (
                                    <div className="error-more">
                                        ... y {result.errors.length - 10} errores más
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="instructions-card">
                <h4>📖 Instrucciones</h4>
                <ol>
                    <li>Descarga la plantilla Excel haciendo clic en "Descargar Plantilla"</li>
                    <li>Completa la plantilla con tus datos (respeta los nombres de las columnas)</li>
                    <li>Selecciona el tipo de datos que vas a importar</li>
                    <li>Sube el archivo Excel completado</li>
                    <li>Revisa los resultados y corrige errores si los hay</li>
                </ol>
                <div className="instructions-note">
                    <strong>Nota:</strong> Los registros duplicados serán omitidos automáticamente.
                </div>
            </div>
        </div>
    )
}
