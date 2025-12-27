'use client'

/**
 * Revisions Tab Component
 * 
 * Displays revisions list and management for a specific project
 * Used within Engineering Hub
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchProjectRevisions } from '@/actions/revisions'
import type { EngineeringRevision } from '@/types'
import { REVISION_STATUS_LABELS } from '@/constants'
import '@/styles/revisions.css'

interface RevisionsTabProps {
    projectId: string
}

export default function RevisionsTab({ projectId }: RevisionsTabProps) {
    const router = useRouter()
    const [revisions, setRevisions] = useState<EngineeringRevision[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')

    useEffect(() => {
        if (projectId) {
            loadRevisions()
        }
    }, [projectId])

    async function loadRevisions() {
        setIsLoading(true)
        setError('')

        try {
            const result = await fetchProjectRevisions(projectId)

            if (result.success) {
                setRevisions(result.data || [])
            } else {
                setError(result.message)
            }
        } catch (err) {
            console.error('Error loading revisions:', err)
            setError('Error al cargar revisiones')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredRevisions = statusFilter === 'ALL'
        ? revisions
        : revisions.filter(r => r.status === statusFilter)

    // Calculate stats
    const stats = {
        total: revisions.length,
        pending: revisions.filter(r => r.status === 'PENDING').length,
        applied: revisions.filter(r => r.status === 'APPLIED').length,
        draft: revisions.filter(r => r.status === 'DRAFT').length
    }

    if (isLoading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                Cargando revisiones...
            </div>
        )
    }

    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        )
    }

    return (
        <div className="revisions-tab-container">
            {/* Stats */}
            <div className="revisions-stats">
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Revisiones</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Pendientes</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.applied}</div>
                        <div className="stat-label">Aplicadas</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.draft}</div>
                        <div className="stat-label">Borradores</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="revisions-filters">
                <div className="filter-group">
                    <label className="filter-label">Estado:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">Todos</option>
                        <option value="DRAFT">Borradores</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="APPROVED">Aprobadas</option>
                        <option value="APPLIED">Aplicadas</option>
                        <option value="REJECTED">Rechazadas</option>
                    </select>
                </div>
            </div>

            {/* Revisions List */}
            {filteredRevisions.length === 0 ? (
                <div className="empty-state-container">
                    <div className="empty-state-icon">📋</div>
                    <h2 className="empty-state-title">No hay revisiones</h2>
                    <p className="empty-state-description">
                        {statusFilter !== 'ALL'
                            ? `No hay revisiones con estado "${REVISION_STATUS_LABELS[statusFilter]?.label || statusFilter}"`
                            : 'Aún no se han creado revisiones para este proyecto'}
                    </p>
                </div>
            ) : (
                <div className="revisions-list">
                    {filteredRevisions.map(revision => {
                        const statusInfo = REVISION_STATUS_LABELS[revision.status] || {
                            label: revision.status,
                            color: '#94a3b8'
                        }

                        return (
                            <div key={revision.id} className="revision-card">
                                <div className="revision-header">
                                    <div className="revision-title">
                                        <h3>Revisión {revision.rev_id}</h3>
                                        <span
                                            className="status-badge"
                                            style={{ background: statusInfo.color }}
                                        >
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="revision-meta">
                                        <span className="meta-item">
                                            {revision.entity_type}
                                        </span>
                                        {revision.announced_at && (
                                            <span className="meta-item">
                                                Anunciada: {new Date(revision.announced_at).toLocaleDateString('es-CL')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="revision-actions">
                                    <button
                                        onClick={() => router.push(`/founder/engineering/revisions/${revision.id}`)}
                                        className="action-button primary"
                                    >
                                        Ver Detalles →
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
