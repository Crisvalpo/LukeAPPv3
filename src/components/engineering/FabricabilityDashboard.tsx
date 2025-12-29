/**
 * Fabricability Dashboard
 * Shows revisions grouped by their fabricability status
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EngineeringRevision } from '@/types'
import {
    getFabricableRevisions,
    getRevisionsBlockedByMaterial,
    getRevisionsBlockedByData
} from '@/services/revision-status'

interface Props {
    projectId: string
}

export default function FabricabilityDashboard({ projectId }: Props) {
    const [fabricable, setFabricable] = useState<EngineeringRevision[]>([])
    const [blockedByMaterial, setBlockedByMaterial] = useState<EngineeringRevision[]>([])
    const [blockedByData, setBlockedByData] = useState<EngineeringRevision[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRevisions()
    }, [projectId])

    async function loadRevisions() {
        try {
            setLoading(true)
            const [fab, matBlocked, dataBlocked] = await Promise.all([
                getFabricableRevisions(projectId),
                getRevisionsBlockedByMaterial(projectId),
                getRevisionsBlockedByData(projectId)
            ])

            setFabricable(fab)
            setBlockedByMaterial(matBlocked)
            setBlockedByData(dataBlocked)
        } catch (error) {
            console.error('Error loading revisions:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="fabricability-dashboard">
                <div className="loading">Cargando análisis de fabricabilidad...</div>
            </div>
        )
    }

    return (
        <div className="fabricability-dashboard">
            <div className="dashboard-header">
                <h2>Fabricabilidad por Revisión</h2>
                <p>Análisis de 3 dimensiones: Lifecycle + Data + Material</p>
            </div>

            <div className="status-grid">
                {/* Fabricable */}
                <div className="status-card fabricable">
                    <div className="card-header">
                        <span className="icon">🟢</span>
                        <h3>Fabricables</h3>
                        <span className="count">{fabricable.length}</span>
                    </div>
                    <div className="card-body">
                        {fabricable.length === 0 ? (
                            <p className="empty">No hay revisiones fabricables</p>
                        ) : (
                            <div className="revision-list">
                                {fabricable.map(rev => (
                                    <RevisionCard key={rev.id} revision={rev} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Blocked by Material */}
                <div className="status-card blocked-material">
                    <div className="card-header">
                        <span className="icon">🟡</span>
                        <h3>Bloqueadas por Material</h3>
                        <span className="count">{blockedByMaterial.length}</span>
                    </div>
                    <div className="card-body">
                        {blockedByMaterial.length === 0 ? (
                            <p className="empty">Ninguna bloqueada por material</p>
                        ) : (
                            <div className="revision-list">
                                {blockedByMaterial.map(rev => (
                                    <RevisionCard key={rev.id} revision={rev} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Blocked by Data */}
                <div className="status-card blocked-data">
                    <div className="card-header">
                        <span className="icon">🟡</span>
                        <h3>Bloqueadas por Datos</h3>
                        <span className="count">{blockedByData.length}</span>
                    </div>
                    <div className="card-body">
                        {blockedByData.length === 0 ? (
                            <p className="empty">Ninguna bloqueada por datos</p>
                        ) : (
                            <div className="revision-list">
                                {blockedByData.map(rev => (
                                    <RevisionCard key={rev.id} revision={rev} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .fabricability-dashboard {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .dashboard-header {
                    margin-bottom: 2rem;
                }

                .dashboard-header h2 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #f7fafc;
                    margin-bottom: 0.5rem;
                }

                .dashboard-header p {
                    color: #a0aec0;
                    font-size: 0.95rem;
                }

                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                .status-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1.25rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .card-header .icon {
                    font-size: 1.5rem;
                }

                .card-header h3 {
                    flex: 1;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #f7fafc;
                    margin: 0;
                }

                .card-header .count {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #63b3ed;
                }

                .card-body {
                    padding: 1rem;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .revision-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .empty {
                    text-align: center;
                    color: #718096;
                    padding: 2rem;
                    font-style: italic;
                }

                .loading {
                    text-align: center;
                    padding: 4rem;
                    color: #a0aec0;
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    )
}

function RevisionCard({ revision }: { revision: EngineeringRevision }) {
    const getDataStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            VACIO: '📄 Vacío',
            EN_DESARROLLO: '🔨 En Desarrollo',
            COMPLETO: '✅ Completo',
            BLOQUEADO: '🔒 Bloqueado'
        }
        return labels[status] || status
    }

    const getMaterialStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            NO_REQUERIDO: '—',
            PENDIENTE_COMPRA: '🛒 Pendiente Compra',
            PENDIENTE_APROBACION: '⏳ Pend. Aprobación',
            EN_TRANSITO: '🚚 En Tránsito',
            DISPONIBLE: '✅ Disponible',
            ASIGNADO: '🎯 Asignado'
        }
        return labels[status] || status
    }

    return (
        <div className="revision-card">
            <div className="revision-header">
                <span className="iso-number">{revision.iso_number}</span>
                <span className="rev-code">Rev {revision.rev_code}</span>
            </div>
            <div className="revision-status">
                <div className="status-badge">
                    {getDataStatusLabel(revision.data_status)}
                </div>
                <div className="status-badge">
                    {getMaterialStatusLabel(revision.material_status)}
                </div>
            </div>

            <style jsx>{`
                .revision-card {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 1rem;
                    transition: all 0.2s;
                }

                .revision-card:hover {
                    background: rgba(0, 0, 0, 0.4);
                    border-color: rgba(99, 179, 237, 0.5);
                    transform: translateY(-2px);
                }

                .revision-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .iso-number {
                    font-weight: 600;
                    color: #63b3ed;
                    font-size: 1rem;
                }

                .rev-code {
                    background: rgba(99, 179, 237, 0.2);
                    color: #90cdf4;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .revision-status {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .status-badge {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.35rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    color: #cbd5e0;
                }
            `}</style>
        </div>
    )
}
