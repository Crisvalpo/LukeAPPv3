'use client'

/**
 * Fabricability Dashboard
 * FASE 2A - Material Control Foundation
 * 
 * Shows an overview of which revisions are ready for fabrication
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    SpoolFabricability,
    analyzeRevisionFabricability,
    getFabricabilitySummary,
    updateAllRevisionStatuses
} from '@/services/fabricability'

interface FabricabilityDashboardProps {
    projectId: string
}

// Update RevisionDetail to hold the spools lists
interface RevisionDetail {
    id: string
    iso_number: string
    rev_code: string
    revision_status: string
    data_status: string
    material_status: string
    is_fabricable: boolean
    blocking_reason?: string
    fabricable_spools_count: number
    total_spools: number
    fabricable_spools: SpoolFabricability[]
    blocked_spools: SpoolFabricability[]
}

// ... (keep state) ...


export default function FabricabilityDashboard({ projectId }: FabricabilityDashboardProps) {
    const [summary, setSummary] = useState({
        total: 0,
        fabricable: 0,
        blocked_by_data: 0,
        blocked_by_material: 0,
        obsolete: 0
    })
    const [revisions, setRevisions] = useState<RevisionDetail[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [filter, setFilter] = useState<'ALL' | 'FABRICABLE' | 'BLOCKED_DATA' | 'BLOCKED_MATERIAL' | 'OBSOLETE'>('ALL')

    // State for expanded rows
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setExpandedRows(newSet)
    }

    useEffect(() => {
        loadFabricabilityData()
    }, [projectId])

    async function handleRefresh() {
        setIsRefreshing(true)
        try {
            await updateAllRevisionStatuses(projectId)
            await loadFabricabilityData()
        } catch (error) {
            console.error('Error refreshing statuses:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    async function loadFabricabilityData() {
        setIsLoading(true)
        try {
            const supabase = createClient()

            // 1. Get summary stats
            const summaryData = await getFabricabilitySummary(projectId)
            setSummary(summaryData)

            // 2. Get all revisions with their statuses
            const { data: revisionsData } = await supabase
                .from('engineering_revisions')
                .select(`
                    id,
                    rev_code,
                    revision_status,
                    data_status,
                    material_status,
                    isometrics!inner(iso_number)
                `)
                .eq('project_id', projectId)
                .order('iso_number', { foreignTable: 'isometrics' })

            if (revisionsData) {
                // Calculate fabricability for each
                const details: RevisionDetail[] = []
                for (const rev of revisionsData) {
                    // Use new granular analysis
                    const analysis = await analyzeRevisionFabricability(rev.id)

                    details.push({
                        id: rev.id,
                        iso_number: (rev.isometrics as any).iso_number,
                        rev_code: rev.rev_code,
                        revision_status: rev.revision_status,
                        data_status: rev.data_status,
                        material_status: rev.material_status,
                        is_fabricable: analysis.is_fully_fabricable,
                        blocking_reason: analysis.blocking_reason,
                        fabricable_spools_count: analysis.fabricable_spools_count,
                        total_spools: analysis.total_spools,
                        fabricable_spools: analysis.fabricable_spools,
                        blocked_spools: analysis.blocked_spools
                    })
                }
                setRevisions(details)
            }
        } catch (error) {
            console.error('Error loading fabricability data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Filter revisions
    const filteredRevisions = revisions.filter(rev => {
        switch (filter) {
            case 'FABRICABLE':
                return rev.is_fabricable
            case 'BLOCKED_DATA':
                return !rev.is_fabricable && rev.data_status !== 'COMPLETO'
            case 'BLOCKED_MATERIAL':
                return !rev.is_fabricable && rev.data_status === 'COMPLETO' && rev.material_status !== 'DISPONIBLE'
            case 'OBSOLETE':
                return rev.revision_status !== 'VIGENTE'
            default:
                return true
        }
    })

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'COMPLETO': '#10b981',
            'EN_DESARROLLO': '#fbbf24',
            'VACIO': '#ef4444',
            'BLOQUEADO': '#6b7280',
            'DISPONIBLE': '#10b981',
            'NO_REQUERIDO': '#3b82f6',
            'PENDIENTE_COMPRA': '#f59e0b',
            'EN_TRANSITO': '#8b5cf6'
        }
        return colors[status] || '#9ca3af'
    }

    if (isLoading && !isRefreshing) {
        return (
            <div className="engineering-content" style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
                    Analizando fabricabilidad...
                </p>
            </div>
        )
    }

    return (
        <div className="engineering-content">
            {/* Header */}
            {/* Header */}
            <div className="section-header">
                <div className="icon">✅</div>
                <div style={{ flex: 1 }}>
                    <h3>3. Fabricabilidad y Control</h3>
                    <p>
                        Visualización de qué revisiones están listas para fabricación
                    </p>
                </div>
                <button
                    className="action-button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? '⏳ Analizando...' : '🔄 Refrescar'}
                </button>
            </div>

            {/* Summary Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)'
            }}>
                <div style={{
                    background: 'var(--color-bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
                        {summary.total}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>
                        Total Revisiones
                    </div>
                </div>

                <div style={{
                    background: 'var(--color-bg-surface-1)',
                    border: '2px solid var(--color-success)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-success)' }}>
                        🟢 {summary.fabricable}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>
                        Fabricables
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                        {summary.total > 0 ? Math.round((summary.fabricable / summary.total) * 100) : 0}% del total
                    </div>
                </div>

                <div style={{
                    background: 'var(--color-bg-surface-1)',
                    border: '1px solid var(--color-warning)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-warning)' }}>
                        🟡 {summary.blocked_by_data}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>
                        Bloqueados por Datos
                    </div>
                </div>

                <div style={{
                    background: 'var(--color-bg-surface-1)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-error)' }}>
                        🔴 {summary.blocked_by_material}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>
                        Bloqueados por Material
                    </div>
                </div>

                <div style={{
                    background: 'var(--color-bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-dim)' }}>
                        ⚫ {summary.obsolete}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>
                        Obsoletas
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="tabs-nav" style={{ marginBottom: 'var(--spacing-4)' }}>
                <button
                    className={`tab-button ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    📊 Todas ({revisions.length})
                </button>
                <button
                    className={`tab-button ${filter === 'FABRICABLE' ? 'active' : ''}`}
                    onClick={() => setFilter('FABRICABLE')}
                >
                    🟢 Fabricables ({summary.fabricable})
                </button>
                <button
                    className={`tab-button ${filter === 'BLOCKED_DATA' ? 'active' : ''}`}
                    onClick={() => setFilter('BLOCKED_DATA')}
                >
                    🟡 Bloq. Datos ({summary.blocked_by_data})
                </button>
                <button
                    className={`tab-button ${filter === 'BLOCKED_MATERIAL' ? 'active' : ''}`}
                    onClick={() => setFilter('BLOCKED_MATERIAL')}
                >
                    🔴 Bloq. Material ({summary.blocked_by_material})
                </button>
                <button
                    className={`tab-button ${filter === 'OBSOLETE' ? 'active' : ''}`}
                    onClick={() => setFilter('OBSOLETE')}
                >
                    ⚫ Obsoletas ({summary.obsolete})
                </button>
            </div>

            {/* Revisions Table */}
            {filteredRevisions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h4>No hay revisiones en esta categoría</h4>
                    <p>Cambia el filtro para ver otras revisiones</p>
                </div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Isométrico</th>
                                <th style={{ textAlign: 'center' }}>Rev</th>
                                <th style={{ textAlign: 'center' }}>Estado Revisión</th>
                                <th style={{ textAlign: 'center' }}>Datos</th>
                                <th style={{ textAlign: 'center' }}>Material</th>
                                <th style={{ textAlign: 'center' }}>Spools Listos</th>
                                <th style={{ textAlign: 'center' }}>Fabricable</th>
                                <th style={{ textAlign: 'left' }}>Motivo Bloqueo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRevisions.map(rev => (
                                <>
                                    <tr
                                        key={rev.id}
                                        onClick={() => toggleRow(rev.id)}
                                        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                        className={expandedRows.has(rev.id) ? 'expanded-row' : ''}
                                    >
                                        <td style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    transform: expandedRows.has(rev.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s'
                                                }}>▶</span>
                                                {rev.iso_number}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-family-mono)' }}>
                                            {rev.rev_code}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: rev.revision_status === 'VIGENTE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                                                color: rev.revision_status === 'VIGENTE' ? '#3b82f6' : '#6b7280'
                                            }}>
                                                {rev.revision_status}
                                            </span>
                                            {/* Derived Process Badge */}
                                            {rev.data_status === 'COMPLETO' && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    background: 'rgba(16, 185, 129, 0.15)',
                                                    color: '#10b981',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                                }}>
                                                    SPOOLEADO
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: `${getStatusColor(rev.data_status)}15`,
                                                color: getStatusColor(rev.data_status)
                                            }}>
                                                {rev.data_status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: `${getStatusColor(rev.material_status)}15`,
                                                color: getStatusColor(rev.material_status)
                                            }}>
                                                {rev.material_status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}>
                                                <span style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '700',
                                                    color: rev.fabricable_spools_count === rev.total_spools ? '#10b981' : '#e2e8f0'
                                                }}>
                                                    {rev.fabricable_spools_count}
                                                </span>
                                                <span style={{ color: '#64748b' }}>/</span>
                                                <span style={{ color: '#94a3b8' }}>{rev.total_spools}</span>
                                            </div>
                                            {rev.total_spools > 0 && (
                                                <div style={{
                                                    width: '60px',
                                                    height: '4px',
                                                    background: '#334155',
                                                    borderRadius: '2px',
                                                    margin: '4px auto 0'
                                                }}>
                                                    <div style={{
                                                        width: `${(rev.fabricable_spools_count / rev.total_spools) * 100}%`,
                                                        height: '100%',
                                                        background: rev.fabricable_spools_count === rev.total_spools ? '#10b981' : '#3b82f6',
                                                        borderRadius: '2px'
                                                    }} />
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                                            {rev.is_fabricable ? '🟢' : '🔴'}
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            {rev.blocking_reason || '-'}
                                        </td>
                                    </tr>
                                    {/* Expanded Detail Row */}
                                    {expandedRows.has(rev.id) && (
                                        <tr key={`${rev.id}-detail`} style={{ background: 'rgba(0,0,0,0.2)' }}>
                                            <td colSpan={8} style={{ padding: '0' }}>
                                                <div style={{ padding: '20px', display: 'flex', gap: '40px', fontSize: '0.9rem' }}>
                                                    {/* Fabricable List */}
                                                    <div style={{ flex: 1 }}>
                                                        <h5 style={{ color: '#10b981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            🟢 Listos para Fabricar ({rev.fabricable_spools?.length || 0})
                                                        </h5>
                                                        {(rev.fabricable_spools?.length || 0) > 0 ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                {rev.fabricable_spools.map(s => (
                                                                    <span key={s.spool_id} style={{
                                                                        padding: '4px 10px',
                                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                                        borderRadius: '4px',
                                                                        color: '#10b981',
                                                                        fontFamily: 'monospace'
                                                                    }}>
                                                                        {s.spool_number}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>Ningún spool listo.</p>
                                                        )}
                                                    </div>

                                                    {/* Blocked List */}
                                                    <div style={{ flex: 1 }}>
                                                        <h5 style={{ color: '#ef4444', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            🔴 Bloqueados por Material ({rev.blocked_spools?.length || 0})
                                                        </h5>
                                                        {(rev.blocked_spools?.length || 0) > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {rev.blocked_spools.map(s => (
                                                                    <div key={s.spool_id} style={{
                                                                        padding: '8px',
                                                                        background: 'rgba(239, 68, 68, 0.05)',
                                                                        border: '1px solid rgba(239, 68, 68, 0.1)',
                                                                        borderRadius: '4px',
                                                                        color: '#ef4444'
                                                                    }}>
                                                                        <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{s.spool_number}</div>
                                                                        <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#fda4af' }}>
                                                                            Falta: {s.missing_items.join(', ')}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay spools bloqueados.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
