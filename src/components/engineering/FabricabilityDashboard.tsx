'use client'

/**
 * Fabricability Dashboard
 * FASE 2A - Material Control Foundation
 * 
 * Shows an overview of which revisions are ready for fabrication
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFabricabilitySummary, isFabricable } from '@/services/fabricability'
import '@/styles/engineering.css'

interface FabricabilityDashboardProps {
    projectId: string
}

interface RevisionDetail {
    id: string
    iso_number: string
    rev_code: string
    revision_status: string
    data_status: string
    material_status: string
    is_fabricable: boolean
    blocking_reason?: string
}

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
    const [filter, setFilter] = useState<'ALL' | 'FABRICABLE' | 'BLOCKED_DATA' | 'BLOCKED_MATERIAL' | 'OBSOLETE'>('ALL')

    useEffect(() => {
        loadFabricabilityData()
    }, [projectId])

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
                    const fab = await isFabricable(rev.id)
                    details.push({
                        id: rev.id,
                        iso_number: (rev.isometrics as any).iso_number,
                        rev_code: rev.rev_code,
                        revision_status: rev.revision_status,
                        data_status: rev.data_status,
                        material_status: rev.material_status,
                        is_fabricable: fab.fabricable,
                        blocking_reason: fab.reason
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

    if (isLoading) {
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
            <div className="section-header">
                <div>
                    <h2>Dashboard de Fabricabilidad</h2>
                    <p className="section-subtitle">
                        Visualización de qué revisiones están listas para fabricación
                    </p>
                </div>
                <button
                    className="action-button"
                    onClick={loadFabricabilityData}
                >
                    🔄 Refrescar
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
                                <th style={{ textAlign: 'center' }}>Fabricable</th>
                                <th style={{ textAlign: 'left' }}>Motivo Bloqueo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRevisions.map(rev => (
                                <tr key={rev.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
                                        {rev.iso_number}
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
                                    <td style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                                        {rev.is_fabricable ? '🟢' : '🔴'}
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                        {rev.blocking_reason || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
