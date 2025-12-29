/**
 * MTO Uploader Component
 * Handles Excel upload for Material Take-Off data
 * Matches DetailUploader pattern for consistency
 */

'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { uploadMTO, getMTOCount, deleteMTO, parseMTOFromArray } from '@/services/mto'
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
        <>
            {!success ? (
                <div className="upload-box">
                    {!file ? (
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileSelect}
                            />
                            <div className="fake-btn">📂 Seleccionar Excel</div>
                        </div>
                    ) : (
                        <div className="file-ready">
                            <div className="file-info">
                                <span className="icon">📄</span>
                                <span className="name">{file.name}</span>
                                <span className="count">({previewCount} filas)</span>
                            </div>

                            <div className="actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setFile(null)}
                                    disabled={uploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-upload"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Procesando...' : '⬆️ Cargar MTO'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="result-box">
                    <div className="result-header success">
                        ✅ MTO cargado exitosamente
                    </div>

                    {mtoCount > 0 && (
                        <div className="stats-grid">
                            <div className="stat created">
                                <span>Registros MTO</span>
                                <strong>{mtoCount.toLocaleString()}</strong>
                            </div>
                        </div>
                    )}

                    <div className="actions">
                        <button
                            className="btn-delete"
                            onClick={handleDelete}
                            disabled={uploading}
                        >
                            🗑️ Eliminar MTO
                        </button>
                        <button
                            className="btn-reset"
                            onClick={() => { setFile(null); setSuccess(false); }}
                        >
                            Cargar otro archivo
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}
        </>
    )
}
