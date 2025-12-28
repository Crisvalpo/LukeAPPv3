'use client'

/**
 * Revisions Tab Component - REFACTORED
 * 
 * Displays revisions with:
 * - Correct schema (isometric_id, rev_code, revision_status)
 * - ISO Number (via JOIN)
 * - Welds count
 * - Proper status filters (VIGENTE, SPOOLEADO, APLICADO)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchProjectRevisions } from '@/actions/revisions'
import type { EngineeringRevision } from '@/types'
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
        : revisions.filter(r => r.revision_status === statusFilter)

    // Calculate stats with correct status values
    const stats = {
        total: revisions.length,
        vigentes: revisions.filter(r => r.revision_status === 'VIGENTE').length,
        spooleadas: revisions.filter(r => r.revision_status === 'SPOOLEADO').length,
        aplicadas: revisions.filter(r => r.revision_status === 'APLICADO').length,
        obsoletas: revisions.filter(r => r.revision_status === 'OBSOLETA').length
    }

    // Status colors mapping
    const statusColors: Record<string, string> = {
        'VIGENTE': '#3b82f6',      // Blue
        'PENDING': '#fbbf24',      // Yellow
        'SPOOLEADO': '#10b981',    // Green
        'APLICADO': '#8b5cf6',     // Purple
        'OBSOLETA': '#6b7280'      // Gray
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
                    <div className="stat-icon">🔵</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.vigentes}</div>
                        <div className="stat-label">Vigentes</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.spooleadas}</div>
                        <div className="stat-label">Spooleadas</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.aplicadas}</div>
                        <div className="stat-label">Aplicadas</div>
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
                        <option value="VIGENTE">Vigentes</option>
                        <option value="SPOOLEADO">Spooleadas</option>
                        <option value="APLICADO">Aplicadas</option>
                        <option value="OBSOLETA">Obsoletas</option>
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
                            ? `No hay revisiones con estado "${statusFilter}"`
                            : 'Aún no se han creado revisiones para este proyecto'}
                    </p>
                    {statusFilter === 'ALL' && (
                        <p className="empty-state-hint">
                            Ve a la tab "1. Anuncio" para cargar revisiones desde un Excel
                        </p>
                    )}
                </div>
            ) : (
                <div className="revisions-list">
                    {filteredRevisions.map(revision => {
                        const statusColor = statusColors[revision.revision_status] || '#94a3b8'

                        return (
                            <div key={revision.id} className="revision-card">
                                <div className="revision-header">
                                    <div className="revision-title">
                                        <h3>{revision.iso_number} - Rev {revision.rev_code}</h3>
                                        <span
                                            className="status-badge"
                                            style={{ background: statusColor }}
                                        >
                                            {revision.revision_status}
                                        </span>
                                    </div>
                                    <div className="revision-meta">
                                        <span className="meta-item">
                                            🔥 {revision.welds_count || 0} soldaduras
                                        </span>
                                        <span className="meta-item">
                                            📦 {revision.spools_count || 0} spools
                                        </span>
                                        {revision.announcement_date && (
                                            <span className="meta-item">
                                                📅 {new Date(revision.announcement_date).toLocaleDateString('es-CL')}
                                            </span>
                                        )}
                                        {revision.transmittal && (
                                            <span className="meta-item">
                                                TML: {revision.transmittal}
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
