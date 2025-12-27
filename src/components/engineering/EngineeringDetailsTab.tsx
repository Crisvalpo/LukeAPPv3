/**
 * ENGINEERING DETAILS TAB
 * 
 * Main component for Phase 2 upload: Engineering details
 * Features: Revision selector + Multi-tab upload (Spools/Welds/MTO/Bolted Joints)
 */

'use client'

import { useState } from 'react'
import RevisionSelector from './RevisionSelector'
import { processDetailUpload, type DetailType, type DetailResult } from '@/services/engineering-details'
import * as XLSX from 'xlsx'

interface Props {
    projectId: string
    companyId: string
}

export default function EngineeringDetailsTab({ projectId, companyId }: Props) {
    const [selectedRevision, setSelectedRevision] = useState<string | null>(null)
    const [isoNumber, setIsoNumber] = useState<string>('')
    const [revCode, setRevCode] = useState<string>('')
    const [activeTab, setActiveTab] = useState<DetailType>('spools')
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<DetailResult | null>(null)

    function handleRevisionSelect(revId: string | null, iso: string, rev: string) {
        setSelectedRevision(revId)
        setIsoNumber(iso)
        setRevCode(rev)
        // Reset file and result when changing revision
        setFile(null)
        setResult(null)
    }

    async function handleUpload() {
        if (!file || !selectedRevision) return

        setIsUploading(true)
        try {
            // Parse Excel
            const data = await parseExcelFile(file)

            // Process upload
            const uploadResult = await processDetailUpload({
                revisionId: selectedRevision,
                projectId,
                companyId,
                detailType: activeTab,
                data
            })

            setResult(uploadResult)
        } catch (error: any) {
            alert(`Error: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

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

    function handleReset() {
        setFile(null)
        setResult(null)
    }

    const tabConfig = {
        spools: { label: 'Spools', icon: '🔩' },
        welds: { label: 'Soldaduras', icon: '🔥' },
        mto: { label: 'MTO', icon: '📦' },
        bolted_joints: { label: 'Juntas Empernadas', icon: '🔗' }
    }

    return (
        <div className="details-tab">
            {/* Header */}
            <div className="details-header">
                <div className="header-content">
                    <div className="icon">🔧</div>
                    <div>
                        <h3>2. Carga de Detalles</h3>
                        <p>Selecciona ISO + Revisión, luego carga spools, soldaduras, MTO o juntas empernadas</p>
                    </div>
                </div>
            </div>

            {/* Revision Selector */}
            <RevisionSelector
                projectId={projectId}
                onRevisionSelect={handleRevisionSelect}
            />

            {/* Show selection summary */}
            {selectedRevision && (
                <div className="selection-summary">
                    <span className="summary-badge">
                        📐 {isoNumber} → 🔄 Rev {revCode}
                    </span>
                </div>
            )}

            {/* Detail Type Tabs */}
            {selectedRevision && (
                <>
                    <div className="detail-tabs">
                        {Object.entries(tabConfig).map(([key, config]) => (
                            <button
                                key={key}
                                className={`detail-tab ${activeTab === key ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(key as DetailType)
                                    setFile(null)
                                    setResult(null)
                                }}
                            >
                                <span className="tab-icon">{config.icon}</span>
                                {config.label}
                            </button>
                        ))}
                    </div>

                    {/* Upload Area */}
                    {!result && (
                        <div className="upload-area">
                            <div className="upload-header">
                                <h4>{tabConfig[activeTab].icon} {tabConfig[activeTab].label}</h4>
                                <button
                                    className="btn-template"
                                    onClick={() => downloadTemplate(activeTab)}
                                >
                                    📥 Descargar Plantilla
                                </button>
                            </div>

                            {!file ? (
                                <div className="file-drop">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                        id="file-input"
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="file-input" className="drop-label">
                                        <div className="drop-icon">📁</div>
                                        <p>Selecciona archivo Excel</p>
                                        <span className="drop-hint">Formato: .xlsx, .xls</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="file-selected">
                                    <div className="file-info">
                                        <span className="file-icon">📄</span>
                                        <span className="file-name">{file.name}</span>
                                        <button className="btn-remove" onClick={() => setFile(null)}>✕</button>
                                    </div>
                                    <div className="file-actions">
                                        <button
                                            className="btn-upload"
                                            onClick={handleUpload}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? '⏳ Procesando...' : '⬆️ Importar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="upload-results">
                            <div className={`results-header ${result.success ? 'success' : 'error'}`}>
                                <span className="result-icon">{result.success ? '✅' : '⚠️'}</span>
                                <h4>{result.success ? 'Importación Exitosa' : 'Importación con Errores'}</h4>
                            </div>

                            <div className="results-summary">
                                <div className="summary-stat">
                                    <span className="stat-label">Total:</span>
                                    <span className="stat-value">{result.summary.total}</span>
                                </div>
                                <div className="summary-stat success">
                                    <span className="stat-label">Creados:</span>
                                    <span className="stat-value">{result.summary.created}</span>
                                </div>
                                <div className="summary-stat warning">
                                    <span className="stat-label">Omitidos:</span>
                                    <span className="stat-value">{result.summary.skipped}</span>
                                </div>
                                {result.summary.errors > 0 && (
                                    <div className="summary-stat error">
                                        <span className="stat-label">Errores:</span>
                                        <span className="stat-value">{result.summary.errors}</span>
                                    </div>
                                )}
                            </div>

                            <button className="btn-new-upload" onClick={handleReset}>
                                Importar Otro Archivo
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Empty state when no revision selected */}
            {!selectedRevision && (
                <div className="empty-select">
                    <div className="empty-icon">👆</div>
                    <p>Selecciona un isométrico y revisión para continuar</p>
                </div>
            )}
        </div>
    )
}

// Template download function
function downloadTemplate(type: DetailType) {
    const templates = {
        spools: {
            headers: ['SPOOL NUMBER', 'ISO NUMBER', 'LINE NUMBER', 'REV', 'WEIGHT', 'DIAMETER'],
            example: ['SP-001', 'ISO-001', 'LINE-A-01', 'A', '150.50', '4"']
        },
        welds: {
            headers: ['WELD NUMBER', 'SPOOL NUMBER', 'TYPE WELD', 'NPS', 'SCH', 'THICKNESS', 'PIPING CLASS', 'MATERIAL', 'DESTINATION', 'SHEET'],
            example: ['W-001', 'SP-001', 'BW', '4', '40', '0.237', 'A106B', 'CS', 'FIELD', '1']
        },
        mto: {
            headers: ['ITEM CODE', 'QTY', 'QTY UNIT', 'PIPING CLASS', 'FAB', 'SHEET', 'LINE NUMBER', 'AREA', 'SPOOL FULL ID', 'SPOOL NUMBER', 'REVISION'],
            example: ['ITM-001', '10', 'EA', 'A106B', 'SHOP', '1', 'LINE-A', 'AREA-1', 'SP-FULL-001', 'SP-001', 'A']
        },
        bolted_joints: {
            headers: ['FLANGED JOINT NUMBER', 'PIPING CLASS', 'MATERIAL', 'RATING', 'NPS', 'BOLT SIZE', 'SHEET', 'LINE NUMBER', 'ISO NUMBER', 'REVISION'],
            example: ['FJ-001', 'A105', 'CS', '150', '4', '5/8', '1', 'LINE-A', 'ISO-001', 'A']
        }
    }

    const config = templates[type]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([config.headers, config.example])

    // Set column widths
    const wscols = config.headers.map(h => ({ wch: Math.max(h.length + 5, 15) }))
    ws['!cols'] = wscols

    XLSX.utils.book_append_sheet(wb, ws, type)
    XLSX.writeFile(wb, `Template_${type}.xlsx`)
}
