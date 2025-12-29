
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EngineeringRevision } from '@/types'
import { deleteRevisionAction } from '@/actions/revisions'

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
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    // Sort revisions falling back to date or code, usually they come sorted but good to be safe
    // Assuming higher rev code is newer.
    const sortedRevisions = [...revisions].sort((a, b) => {
        return b.rev_code.localeCompare(a.rev_code, undefined, { numeric: true, sensitivity: 'base' })
    })

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
                        <div className="quick-stat info" title="Spooleadas">
                            <span className="label">Spool.</span>
                            <span className="value">{stats.spooleadas}</span>
                        </div>
                    </div>
                </div>

                <div className="card-controls">
                    {/* Could add bulk actions here */}
                    <button
                        className={`btn - expand ${isExpanded ? 'active' : ''} `}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Ocultar Historial' : 'Ver Historial'}
                        <span className="chevron">▼</span>
                    </button>
                </div>
            </div>

            {/* Expanded History */}
            {isExpanded && (
                <div className="isometric-history">
                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Rev</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th>Soldaduras</th>
                                    <th>Spools</th>
                                    <th>TML</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRevisions.map(rev => (
                                    <tr key={rev.id} className={rev.id === currentRevision?.id ? 'active-row' : ''}>
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
                                            {rev.announcement_date
                                                ? new Date(rev.announcement_date).toLocaleDateString('es-CL')
                                                : '-'
                                            }
                                        </td>
                                        <td>{rev.welds_count || 0}</td>
                                        <td>{rev.spools_count || 0}</td>
                                        <td className="col-tml" title={rev.transmittal || ''}>
                                            {rev.transmittal || '-'}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-group">
                                                <button
                                                    className="btn-link-action"
                                                    onClick={() => router.push(`/ founder / engineering / revisions / ${rev.id} `)}
                                                >
                                                    Ver Detalles
                                                </button>
                                                <button
                                                    className="btn-icon-danger"
                                                    onClick={() => handleDelete(rev.id, rev.rev_code)}
                                                    disabled={isDeleting === rev.id}
                                                    title="Eliminar Revisión"
                                                >
                                                    {isDeleting === rev.id ? '...' : '🗑️'}
                                                </button>
                                            </div>
                                        </td>
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
