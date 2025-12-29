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
import '@/styles/engineering-details.css'

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
        <div className="detail-section">
            <div className="section-info">
                <p>Carga el Excel con isométricos y sus revisiones para iniciar el flujo de ingeniería.</p>
                <button
                    className="btn-link"
                    onClick={downloadAnnouncementTemplate}
                >
                    📥 Descargar Plantilla
                </button>
            </div>

            {!file && !result && (
                <div className="detail-uploader">
                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={(e) => {
                                if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                            }}
                        />
                        <div className="fake-btn">📂 Seleccionar Excel</div>
                    </div>
                </div>
            )}

            {file && !result && (
                <div className="file-section">
                    <FilePreview
                        file={file}
                        preview={preview}
                        validationErrors={validationErrors}
                        onRemove={handleReset}
                    />

                    <div className="upload-actions">
                        <button
                            className="btn-secondary"
                            onClick={handleReset}
                            disabled={isUploading}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleUpload}
                            disabled={isUploading || validationErrors.length > 0}
                        >
                            {isUploading ? (
                                <>
                                    <span className="spinner" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <span>⬆️</span>
                                    Importar Anuncio
                                </>
                            )}
                        </button>
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
        <div className="file-preview">
            <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                    <h4>{file.name}</h4>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    {preview && <span className="file-rows">{preview.length}+ filas detectadas</span>}
                </div>
                <button className="btn-remove" onClick={onRemove}>✕</button>
            </div>

            {validationErrors.length > 0 && (
                <div className="validation-errors">
                    <h5>⚠️ Errores de Validación</h5>
                    <ul>
                        {validationErrors.slice(0, 5).map((error, i) => (
                            <li key={i}>
                                <strong>Fila {error.row}:</strong> {error.message}
                            </li>
                        ))}
                    </ul>
                    {validationErrors.length > 5 && (
                        <p className="more-errors">
                            y {validationErrors.length - 5} errores más...
                        </p>
                    )}
                </div>
            )}

            {preview && validationErrors.length === 0 && (
                <div className="preview-table">
                    <h5>✅ Vista Previa (primeras 10 filas)</h5>
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    {Object.keys(preview[0] || {}).map(key => (
                                        <th key={key}>{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((row, i) => (
                                    <tr key={i}>
                                        {Object.values(row).map((val: any, j) => (
                                            <td key={j}>{String(val)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
    return (
        <div className="upload-results">
            <div className={`results-header ${result.success ? 'success' : 'error'}`}>
                <div className="icon">{result.success ? '✅' : '⚠️'}</div>
                <div>
                    <h3>{result.success ? 'Importación Exitosa' : 'Importación con Errores'}</h3>
                    <p>
                        {result.success
                            ? 'Los anuncios de revisión fueron procesados correctamente'
                            : 'Se encontraron errores durante la importación'
                        }
                    </p>
                </div>
            </div>

            <div className="results-summary">
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="label">Total Procesadas</span>
                        <span className="value">{result.summary.total}</span>
                    </div>
                    <div className="summary-item success">
                        <span className="label">Isométricos Creados</span>
                        <span className="value">{result.summary.isometricsCreated}</span>
                    </div>
                    <div className="summary-item info">
                        <span className="label">Revisiones Creadas</span>
                        <span className="value">{result.summary.revisionsCreated}</span>
                    </div>
                    <div className="summary-item warning">
                        <span className="label">Omitidos (Duplicados)</span>
                        <span className="value">{result.summary.revisionsSkipped}</span>
                    </div>
                    {result.summary.errors > 0 && (
                        <div className="summary-item error">
                            <span className="label">Errores</span>
                            <span className="value">{result.summary.errors}</span>
                        </div>
                    )}
                </div>
            </div>

            {result.details.length > 0 && (
                <div className="results-details">
                    <h4>Detalles</h4>
                    <div className="details-list">
                        {result.details.slice(0, 20).map((detail, i) => (
                            <div key={i} className={`detail-item ${detail.action}`}>
                                <span className="detail-icon">
                                    {detail.action === 'created' && '✅'}
                                    {detail.action === 'updated' && '🔄'}
                                    {detail.action === 'skipped' && '⏭️'}
                                    {detail.action === 'error' && '❌'}
                                </span>
                                <span className="detail-text">{detail.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="results-actions">
                <button className="btn-primary" onClick={onReset}>
                    Importar Otro Archivo
                </button>
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
