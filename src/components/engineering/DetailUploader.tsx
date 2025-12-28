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

                    {result.was_auto_spooled && (
                        <div className="info-banner success">
                            🎯 <strong>Revisión marcada como SPOOLEADO automáticamente.</strong>
                            <p>Esta es la primera revisión cargada, por lo que fue marcada lista para fabricación.</p>
                        </div>
                    )}

                    {result.requires_impact_evaluation && (
                        <div className="info-banner warning">
                            ⚠️ <strong>REQUIERE EVALUACIÓN DE IMPACTOS</strong>
                            <p>Ya existe una revisión spooleada anterior. Antes de aplicar esta revisión, debes verificar los impactos en spools fabricados.</p>
                        </div>
                    )}

                    {result.errors.length > 0 && (
                        <div className="error-list">
                            <h5>Errores:</h5>
                            <ul>
                                {result.errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        className="btn-reset"
                        onClick={() => { setFile(null); setResult(null); }}
                    >
                        Cargar otro archivo
                    </button>
                </div>
            )}

            <style jsx>{`
                .detail-uploader {
                    margin-top: 20px;
                    border: 1px dashed rgba(255,255,255,0.2);
                    border-radius: 8px;
                    padding: 20px;
                    background: rgba(0,0,0,0.2);
                }
                .file-input-wrapper {
                    position: relative;
                    height: 80px;
                    border: 2px dashed rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .file-input-wrapper:hover { border-color: var(--accent); background: rgba(255,255,255,0.02); }
                .file-input-wrapper input {
                    position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer;
                }
                .fake-btn { font-weight: 500; color: var(--accent); }
                
                .file-ready {
                    display: flex; flex-direction: column; gap: 15px;
                }
                .file-info {
                    display: flex; align-items: center; gap: 10px;
                    background: rgba(255,255,255,0.05);
                    padding: 10px; border-radius: 5px;
                }
                .actions { display: flex; gap: 10px; justify-content: flex-end; }
                .btn-upload {
                    background: var(--accent); color: #000; border: none;
                    padding: 8px 16px; border-radius: 4px; font-weight: 600;
                    cursor: pointer;
                }
                
                .result-message {
                    background: rgba(255,255,255,0.05);
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    font-size: 0.95rem;
                }

                .stats-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;
                    margin: 20px 0;
                }
                .stat {
                    background: rgba(255,255,255,0.05); padding: 10px;
                    border-radius: 5px; text-align: center;
                }
                .stat span { display: block; font-size: 0.8rem; color: #888; }
                .stat strong { font-size: 1.2rem; }
                .stat.created strong { color: #4ade80; }
                .stat.success strong { color: #4ade80; }
                
                .info-banner {
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    border-left: 3px solid;
                }
                .info-banner.success {
                    background: rgba(74, 222, 128, 0.1);
                    border-color: #4ade80;
                }
                .info-banner.warning {
                    background: rgba(251, 191, 36, 0.1);
                    border-color: #fbbf24;
                }
                .info-banner p {
                    margin-top: 5px;
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                
                .error-list { 
                    background: rgba(254, 64, 94, 0.1); 
                    padding: 10px; border-radius: 5px; margin-bottom: 15px;
                }
                .error-list li { font-size: 0.9rem; color: #ffb4b4; margin-bottom: 4px; }
            `}</style>
        </div>
    )
}
