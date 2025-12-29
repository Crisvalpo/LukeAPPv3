/**
 * Joints Uploader Component
 * Handles Excel upload for Bolted Joints data
 * Matches DetailUploader pattern for consistency
 */

'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { uploadJoints, getJointsCount, deleteJoints, parseJointsFromArray } from '@/services/joints'
import { downloadJointsTemplate } from '@/lib/utils/template-generator'

interface Props {
    revisionId: string
    projectId: string
    companyId: string
}

export default function JointsUploader({ revisionId, projectId, companyId }: Props) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [jointsCount, setJointsCount] = useState<number>(0)
    const [previewCount, setPreviewCount] = useState(0)

    useEffect(() => {
        loadJointsCount()
    }, [revisionId])

    async function loadJointsCount() {
        try {
            const count = await getJointsCount(revisionId)
            setJointsCount(count)
        } catch (err) {
            console.error('Error loading Joints count:', err)
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

            // Parse Joints data
            const jointsRows = parseJointsFromArray(rawData)

            if (jointsRows.length === 0) {
                throw new Error('No se encontraron datos válidos en el Excel')
            }

            // Upload to database
            await uploadJoints(revisionId, projectId, companyId, jointsRows)

            setSuccess(true)
            setFile(null)
            setPreviewCount(0)

            // Reload count
            await loadJointsCount()

        } catch (err) {
            console.error('Error uploading Joints:', err)
            setError(err instanceof Error ? err.message : 'Error al procesar el archivo')
        } finally {
            setUploading(false)
        }
    }

    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar todos los datos de Juntas para esta revisión?')) {
            return
        }

        setUploading(true)
        setError(null)

        try {
            await deleteJoints(revisionId)
            setSuccess(true)
            await loadJointsCount()
        } catch (err) {
            console.error('Error deleting Joints:', err)
            setError(err instanceof Error ? err.message : 'Error al eliminar Juntas')
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
                                    {uploading ? 'Procesando...' : '⬆️ Cargar Juntas'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="result-box">
                    <div className="result-header success">
                        ✅ Juntas cargadas exitosamente
                    </div>

                    {jointsCount > 0 && (
                        <div className="stats-grid">
                            <div className="stat created">
                                <span>Juntas Cargadas</span>
                                <strong>{jointsCount.toLocaleString()}</strong>
                            </div>
                        </div>
                    )}

                    <div className="actions">
                        <button
                            className="btn-delete"
                            onClick={handleDelete}
                            disabled={uploading}
                        >
                            🗑️ Eliminar Juntas
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
