'use client'

/**
 * Revisions Tab Component - REFACTORED PHASE 3
 * 
 * Displays revisions GROUPED BY ISOMETRIC:
 * - Groups multiple revisions (0, 1, 2...) under one Isometric Card
 * - Shows summary stats per isometric
 * - Collapsible history view
 */

import { useState, useEffect, useMemo } from 'react'
import { fetchProjectRevisions } from '@/actions/revisions'
import type { EngineeringRevision } from '@/types'
import IsometricRevisionCard from './IsometricRevisionCard'
import '@/styles/revisions.css'

interface RevisionsTabProps {
    projectId: string
}

interface GroupedIsometric {
    iso_number: string
    revisions: EngineeringRevision[]
    current_revision: EngineeringRevision | null
    stats: {
        total: number
        vigentes: number
        spooleadas: number
        obsoletas: number
    }
}

export default function RevisionsTab({ projectId }: RevisionsTabProps) {
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

    // Grouping Logic
    const groupedIsometrics = useMemo(() => {
        const groups: Record<string, EngineeringRevision[]> = {}

        revisions.forEach(rev => {
            const iso = rev.iso_number || 'SIN-ISO'
            if (!groups[iso]) {
                groups[iso] = []
            }
            groups[iso].push(rev)
        })

        // Transform to GroupedIsometric objects
        const result: GroupedIsometric[] = Object.keys(groups).map(isoNum => {
            const isoRevisions = groups[isoNum]

            // Determine "Current" revision
            const vigentes = isoRevisions.filter(r => r.revision_status === 'VIGENTE')
            let current = vigentes.length > 0
                ? vigentes[vigentes.length - 1] // Last VIGENTE
                : isoRevisions.sort((a, b) => b.rev_code.localeCompare(a.rev_code, undefined, { numeric: true }))[0]

            // Stats
            const stats = {
                total: isoRevisions.length,
                vigentes: isoRevisions.filter(r => r.revision_status === 'VIGENTE').length,
                spooleadas: isoRevisions.filter(r => r.revision_status === 'SPOOLEADO').length,
                obsoletas: isoRevisions.filter(r => ['OBSOLETA', 'OBSOLETO', 'OBSOLETO_SPOOLEADO'].includes(r.revision_status)).length
            }

            return {
                iso_number: isoNum,
                revisions: isoRevisions,
                current_revision: current,
                stats
            }
        })

        // Sort by ISO number
        return result.sort((a, b) => a.iso_number.localeCompare(b.iso_number))
    }, [revisions])

    // Filter Logic
    const filteredGroups = statusFilter === 'ALL'
        ? groupedIsometrics
        : groupedIsometrics.filter(g => g.current_revision?.revision_status === statusFilter)

    // Global Stats
    const globalStats = {
        totalIsometrics: groupedIsometrics.length,
        totalRevisions: revisions.length,
        isometricsVigentes: groupedIsometrics.filter(g => g.current_revision?.revision_status === 'VIGENTE').length
    }

    if (isLoading) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem', borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#3b82f6' }}></div>
                Cargando historial de ingeniería...
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
            {/* Global Stats Bar */}
            <div className="revisions-stats">
                <div className="stat-card">
                    <div className="stat-icon">📐</div>
                    <div className="stat-content">
                        <div className="stat-value">{globalStats.totalIsometrics}</div>
                        <div className="stat-label">Isométricos</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <div className="stat-value">{globalStats.totalRevisions}</div>
                        <div className="stat-label">Total Versiones</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{globalStats.isometricsVigentes}</div>
                        <div className="stat-label">Isos Vigentes</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="revisions-filters">
                <div className="filter-group">
                    <label className="filter-label">Filtrar por Estado Actual:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">Todos los Isométricos</option>
                        <option value="VIGENTE">Solo Vigentes</option>
                        <option value="SPOOLEADO">Solo Spooleados</option>
                        <option value="PENDING">Solo Pendientes</option>
                    </select>
                </div>
            </div>

            {/* Grouped List */}
            {filteredGroups.length === 0 ? (
                <div className="empty-state-container">
                    <div className="empty-state-icon">📂</div>
                    <h2 className="empty-state-title">No hay isométricos</h2>
                    <p className="empty-state-description">
                        No se encontraron isométricos que coincidan con los filtros.
                    </p>
                </div>
            ) : (
                <div className="revisions-list grouped-list">
                    {filteredGroups.map(group => (
                        <IsometricRevisionCard
                            key={group.iso_number}
                            isoNumber={group.iso_number}
                            revisions={group.revisions}
                            currentRevision={group.current_revision}
                            stats={group.stats}
                            onRefresh={loadRevisions}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
