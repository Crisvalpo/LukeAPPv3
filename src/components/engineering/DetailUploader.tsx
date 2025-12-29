/**
 * DETAIL UPLOADER - WELDS-FIRST PATTERN
 * 
 * Simpler uploader supporting only Welds upload.
 * Shows auto-spooling status and impact evaluation warnings.
 */

'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
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
        <div className="detail-uploader">
            {!result ? (
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
                                    disabled={isUploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-upload"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Procesando...' : '⬆️ Iniciar Carga'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="result-box">
                    <div className={`result-header ${result.success ? 'success' : 'warning'}`}>
                        {result.success ? '✅ Carga Exitosa' : '⚠️ Carga con Errores'}
                    </div>

                    <div className="result-message">
                        {result.message}
                    </div>

                    <div className="stats-grid">
                        <div className="stat created">
                            <span>Soldaduras</span>
                            <strong>{result.details.welds_inserted}</strong>
                        </div>
                        <div className="stat">
                            <span>Spools</span>
                            <strong>{result.details.spools_detected}</strong>
                        </div>
                        {result.was_auto_spooled && (
                            <div className="stat success">
                                <span>Auto-Spooleado</span>
                                <strong>✓</strong>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {result?.was_auto_spooled && (
                <div className="info-banner success">
                    🎯 <strong>Revisión marcada como SPOOLEADO automáticamente.</strong>
                    <p>Esta es la primera revisión cargada, por lo que fue marcada lista para fabricación.</p>
                </div>
            )}

            {result?.requires_impact_evaluation && (
                <div className="info-banner warning">
                    ⚠️ <strong>REQUIERE EVALUACIÓN DE IMPACTOS</strong>
                    <p>Ya existe una revisión spooleada anterior. Antes de aplicar esta revisión, debes verificar los impactos en spools fabricados.</p>
                </div>
            )}

            {result?.errors && result.errors.length > 0 && (
                <div className="error-list">
                    <h5>Errores:</h5>
                    <ul>
                        {result.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
