
'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import type { EngineeringRevision } from '@/types'
import { deleteRevisionAction } from '@/actions/revisions'
import { calculateDataStatus, calculateMaterialStatus, isFabricable, type DataStatus, type MaterialStatus } from '@/services/fabricability'
import RevisionMasterView from './RevisionMasterView'
import IsometricViewer from './viewer/IsometricViewer'
import { createClient } from '@/lib/supabase/client'
import { updateRevisionModelUrlAction } from '@/actions/revisions'

// Wrapper to load spools for viewer
function IsometricViewerWrapper({
    revisionId,
    modelUrl,
    initialModelData
}: {
    revisionId: string
    modelUrl: string
    initialModelData: any
}) {
    const [spools, setSpools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSpools() {
            try {
                const { getRevisionSpoolsAction } = await import('@/actions/revisions')
                const data = await getRevisionSpoolsAction(revisionId)
                setSpools(data || [])
            } catch (error) {
                console.error('Error loading spools:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSpools()
    }, [revisionId])

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'white'
            }}>
                Cargando spools...
            </div>
        )
    }

    return (
        <IsometricViewer
            modelUrl={modelUrl}
            spools={spools}
            initialModelData={initialModelData}
            onSaveData={async (data) => {
                const { updateModelDataAction } = await import('@/actions/revisions')
                await updateModelDataAction(revisionId, data)
            }}
        />
    )
}


interface IsometricRevisionCardProps {
    isoNumber: string
    revisions: EngineeringRevision[]
    currentRevision: EngineeringRevision | null
    stats: {
        total: number
        vigentes: number
        spooleadas: number
        obsoletas: number
    }
    onRefresh?: () => void
}

export default function IsometricRevisionCard({
    isoNumber,
    revisions,
    currentRevision,
    stats,
    onRefresh
}: IsometricRevisionCardProps) {
    const router = useRouter()
    const [isExpanded, setIsExpanded] = useState(false)
    const [openRevId, setOpenRevId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState<string | null>(null)
    const [revisionStatuses, setRevisionStatuses] = useState<Record<string, { data: DataStatus; material: MaterialStatus; fabricable: boolean }>>({})
    const [uploadInputRevId, setUploadInputRevId] = useState<string | null>(null)
    const [show3DMenu, setShow3DMenu] = useState<string | null>(null)
    const [viewerModalRevision, setViewerModalRevision] = useState<{
        id: string
        glbUrl: string
        modelData: any
        isoNumber: string
    } | null>(null)

    // Load fabricability statuses
    useEffect(() => {
        async function loadStatuses() {
            const statuses: Record<string, { data: DataStatus; material: MaterialStatus; fabricable: boolean }> = {}
            for (const rev of revisions) {
                try {
                    const data = await calculateDataStatus(rev.id)
                    const material = await calculateMaterialStatus(rev.id)
                    const fab = await isFabricable(rev.id)
                    statuses[rev.id] = { data, material, fabricable: fab.fabricable }
                } catch (error) {
                    console.error(`Error loading status for revision ${rev.id}:`, error)
                }
            }
            setRevisionStatuses(statuses)
        }
        if (revisions.length > 0) {
            loadStatuses()
        }
    }, [revisions])

    // Sort revisions falling back to date or code, usually they come sorted but good to be safe
    // Assuming higher rev code is newer.
    const sortedRevisions = [...revisions].sort((a, b) => {
        return b.rev_code.localeCompare(a.rev_code, undefined, { numeric: true, sensitivity: 'base' })
    })

    // DEBUG: Log revision data to see if counts are coming from backend
    useEffect(() => {
        if (revisions.length > 0) {
            console.log('[IsometricRevisionCard] Revisions data:', revisions.map(r => ({
                rev_code: r.rev_code,
                welds_count: r.welds_count,
                spools_count: r.spools_count,
                status: r.revision_status
            })))
        }
    }, [revisions])

    const statusColors: Record<string, string> = {
        'VIGENTE': '#3b82f6',      // Blue
        'PENDING': '#fbbf24',      // Yellow
        'SPOOLEADO': '#10b981',    // Green
        'APLICADO': '#8b5cf6',     // Purple
        'OBSOLETA': '#6b7280',     // Gray
        'ELIMINADO': '#ef4444'     // Red
    }

    const currentStatus = currentRevision?.revision_status || 'DESCONOCIDO'
    const statusColor = statusColors[currentStatus] || '#94a3b8'

    const handleDelete = async (revId: string, revCode: string) => {
        const message = '¿Estás seguro de eliminar la Revisión ' + revCode + '?\n\nSi borras la revisión vigente, la anterior pasará a ser la vigente automáticamente.';
        if (!window.confirm(message)) {
            return
        }

        setIsDeleting(revId)
        try {
            const result = await deleteRevisionAction(revId)
            if (result.success) {
                router.refresh() // Keep this for good measure for server data
                if (onRefresh) onRefresh() // Trigger parent refresh
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error('Error deleting revision:', error)
            alert('Error al eliminar la revisión')
        } finally {
            setIsDeleting(null)
        }
    }

    const handleUploadClick = (revId: string) => {
        setUploadInputRevId(revId === uploadInputRevId ? null : revId)
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, revId: string, isoNumber: string, revCode: string) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.glb')) {
            alert('Solo se permiten archivos .glb')
            return
        }

        setIsUploading(revId)
        try {
            // 1. Rename file
            const newFileName = `${isoNumber}-${revCode}.glb`

            // 2. Upload to Supabase Storage
            const supabase = createClient()
            const { data, error: uploadError } = await supabase
                .storage
                .from('isometric-models')
                .upload(newFileName, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError)
                throw new Error(uploadError.message)
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('isometric-models')
                .getPublicUrl(newFileName)

            // 3. Update Revision Record (Server Action)
            const result = await updateRevisionModelUrlAction(revId, publicUrl)

            if (!result.success) {
                throw new Error(result.message)
            }

            alert('Modelo subido exitosamente')
            setUploadInputRevId(null)
            if (onRefresh) onRefresh()

        } catch (error) {
            console.error('Error uploading model:', error)
            alert('Error al subir el modelo')
        } finally {
            setIsUploading(null)
        }
    }

    return (
        <div className="isometric-card">
            {/* Header / Summary */}
            <div className="isometric-card-header">
                <div className="header-main">
                    <div className="iso-identity">
                        <div className="iso-icon">📐</div>
                        <div className="iso-info">
                            <h3>{isoNumber}</h3>
                            <span
                                className="current-status-badge"
                                style={{ background: statusColor }}
                            >
                                {currentStatus} {currentRevision ? `- Rev ${currentRevision.rev_code} ` : ''}
                            </span>
                        </div>
                    </div>

                    <div className="iso-quick-stats">
                        <div className="quick-stat" title="Total Revisiones">
                            <span className="label">Total</span>
                            <span className="value">{stats.total}</span>
                        </div>
                        {stats.obsoletas > 0 && (
                            <div className="quick-stat warning" title="Obsoletas">
                                <span className="label">Obs.</span>
                                <span className="value">{stats.obsoletas}</span>
                            </div>
                        )}
                        <div className="quick-stat info" title="Revisiones Spooleadas">
                            <span className="label">Spooleadas</span>
                            <span className="value">{stats.spooleadas}</span>
                        </div>
                    </div>
                </div>

                <div className="card-controls">
                    {/* Could add bulk actions here */}

                    <button
                        className={`btn-expand ${isExpanded ? 'active' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Ocultar Historial' : 'Ver Historial'}
                        <span className="chevron">▼</span>
                    </button>
                </div>
            </div>

            {/* Expanded History */}
            {
                isExpanded && (
                    <div className="isometric-history">
                        <div className="history-table-wrapper">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Rev</th>
                                        <th>Estado</th>
                                        <th>Datos</th>
                                        <th>Material</th>
                                        <th>Fab</th>
                                        <th>F. Anuncio</th>
                                        <th>Uniones</th>
                                        <th>Spools</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRevisions.map(rev => (
                                        <Fragment key={rev.id}>
                                            <tr className={rev.id === currentRevision?.id ? 'active-row' : ''}>
                                                <td className="col-rev">
                                                    <span className="rev-circle">{rev.rev_code}</span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="status-pill"
                                                        style={{
                                                            color: statusColors[rev.revision_status] || '#ccc',
                                                            borderColor: statusColors[rev.revision_status] || '#ccc',
                                                            background: `${statusColors[rev.revision_status] || '#ccc'} 15` // 15 = hex opacity approx 8%
                                                        }}
                                                    >
                                                        {rev.revision_status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="status-pill"
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: revisionStatuses[rev.id]?.data === 'COMPLETO' ? '#10b981' : '#fbbf24',
                                                            borderColor: revisionStatuses[rev.id]?.data === 'COMPLETO' ? '#10b981' : '#fbbf24'
                                                        }}
                                                    >
                                                        {revisionStatuses[rev.id]?.data || '...'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="status-pill"
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: revisionStatuses[rev.id]?.material === 'DISPONIBLE' ? '#10b981' : '#6b7280',
                                                            borderColor: revisionStatuses[rev.id]?.material === 'DISPONIBLE' ? '#10b981' : '#6b7280'
                                                        }}
                                                    >
                                                        {revisionStatuses[rev.id]?.material || '...'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                                                    {revisionStatuses[rev.id]?.fabricable ? '🟢' : '🔴'}
                                                </td>
                                                <td title={rev.transmittal ? `TML: ${rev.transmittal}` : 'Sin transmittal'}>
                                                    <span style={{ fontSize: '0.9rem' }}>
                                                        {rev.announcement_date
                                                            ? new Date(rev.announcement_date).toLocaleDateString('es-CL')
                                                            : '-'
                                                        }
                                                    </span>
                                                    {rev.transmittal && (
                                                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' }}>
                                                            {rev.transmittal}
                                                        </div>
                                                    )}
                                                </td>
                                                <td><strong>{rev.welds_count || 0}</strong></td>
                                                <td><strong>{rev.spools_count || 0}</strong></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="action-group">
                                                        <button
                                                            className="btn-icon-secondary"
                                                            onClick={() => setOpenRevId(openRevId === rev.id ? null : rev.id)}
                                                            title="Ver detalles"
                                                            style={{
                                                                marginRight: '5px',
                                                                transform: openRevId === rev.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s ease',
                                                                color: 'white',
                                                                fontSize: '0.9rem'
                                                            }}
                                                        >
                                                            ▼
                                                        </button>

                                                        {/* Upload / View Model Button */}
                                                        {/* 3D Model Status/Action Button */}
                                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (rev.glb_model_url) {
                                                                        setShow3DMenu(show3DMenu === rev.id ? null : rev.id)
                                                                    } else {
                                                                        handleUploadClick(rev.id)
                                                                    }
                                                                }}
                                                                style={{
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'bold',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    color: rev.glb_model_url ? '#22c55e' : '#94a3b8',
                                                                    backgroundColor: 'transparent',
                                                                    marginRight: '5px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (rev.glb_model_url) {
                                                                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'
                                                                    } else {
                                                                        e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.5)'
                                                                        e.currentTarget.style.color = '#cbd5e1'
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                                    e.currentTarget.style.color = rev.glb_model_url ? '#22c55e' : '#94a3b8'
                                                                }}
                                                                title={rev.glb_model_url ? 'Opciones Modelo 3D' : 'Cargar Modelo 3D'}
                                                            >
                                                                3D
                                                            </button>

                                                            {/* 3D Menu */}
                                                            {show3DMenu === rev.id && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    left: 0,
                                                                    marginTop: '4px',
                                                                    width: '128px',
                                                                    backgroundColor: '#1e293b',
                                                                    border: '1px solid #475569',
                                                                    borderRadius: '4px',
                                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                                                    zIndex: 50,
                                                                    display: 'flex',
                                                                    flexDirection: 'column' as const,
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <button
                                                                        style={{
                                                                            padding: '8px 12px',
                                                                            textAlign: 'left' as const,
                                                                            fontSize: '0.75rem',
                                                                            color: 'white',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            width: '100%'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setViewerModalRevision({
                                                                                id: rev.id,
                                                                                glbUrl: rev.glb_model_url!,
                                                                                modelData: rev.model_data,
                                                                                isoNumber: isoNumber
                                                                            })
                                                                            setShow3DMenu(null)
                                                                        }}
                                                                    >
                                                                        👁️ Ver Modelo
                                                                    </button>
                                                                    <button
                                                                        style={{
                                                                            padding: '8px 12px',
                                                                            textAlign: 'left' as const,
                                                                            fontSize: '0.75rem',
                                                                            color: '#f87171',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            borderTop: '1px solid #475569',
                                                                            cursor: 'pointer',
                                                                            width: '100%'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation()
                                                                            if (confirm('¿Eliminar modelo 3D?')) {
                                                                                const { deleteRevisionModelUrlAction } = await import('@/actions/revisions')
                                                                                const res = await deleteRevisionModelUrlAction(rev.id, rev.glb_model_url!)
                                                                                if (res.success) {
                                                                                    window.location.reload()
                                                                                } else {
                                                                                    alert(res.message)
                                                                                }
                                                                            }
                                                                            setShow3DMenu(null)
                                                                        }}
                                                                    >
                                                                        🗑️ Borrar
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            className="btn-icon-danger"
                                                            onClick={() => handleDelete(rev.id, rev.rev_code)}
                                                            disabled={isDeleting === rev.id}
                                                            title="Eliminar Revisión"
                                                        >
                                                            {isDeleting === rev.id ? '...' : '🗑️'}
                                                        </button>
                                                    </div>

                                                    {/* Hidden File Input (conditionally rendered) */}
                                                    {uploadInputRevId === rev.id && (
                                                        <div style={{ position: 'absolute', right: '40px', marginTop: '30px', background: '#1e293b', padding: '5px', borderRadius: '4px', border: '1px solid #334155', zIndex: 50 }}>
                                                            <input
                                                                type="file"
                                                                accept=".glb"
                                                                className="text-xs text-white"
                                                                onChange={(e) => handleFileChange(e, rev.id, isoNumber, rev.rev_code)}
                                                            />
                                                            <button onClick={() => setUploadInputRevId(null)} style={{ marginLeft: '5px', color: '#ef4444' }}>✕</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                            {openRevId === rev.id && (
                                                <tr>
                                                    <td colSpan={9} style={{ padding: 0, borderBottom: 'none' }}>
                                                        <RevisionMasterView
                                                            revisionId={rev.id}
                                                            projectId={rev.project_id}
                                                            glbModelUrl={rev.glb_model_url}
                                                            modelData={rev.model_data}
                                                        // TODO: Pass spools data here. For now it will prompt empty list.
                                                        // Ideally we fetch spools in MasterView or lift state.
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}


                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Fullscreen 3D Viewer Modal */}
            {viewerModalRevision && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#0f172a',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column' as const
                }}>
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#1e293b'
                    }}>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>
                            Visor 3D - {viewerModalRevision.isoNumber}
                        </h2>
                        <button
                            onClick={() => setViewerModalRevision(null)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                        >
                            ✕ Cerrar
                        </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <IsometricViewerWrapper
                            revisionId={viewerModalRevision.id}
                            modelUrl={viewerModalRevision.glbUrl}
                            initialModelData={viewerModalRevision.modelData}
                        />
                    </div>
                </div>
            )}
        </div >
    )
}
